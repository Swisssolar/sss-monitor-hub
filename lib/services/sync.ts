import { prisma } from "@/lib/prisma";
import { encryptSecret, maybeDecrypt } from "@/lib/crypto";
import type { ProviderConnection, Site, ProviderType } from "@prisma/client";
import { getAdapter } from "@/lib/providers/registry";
import { demoAdapter } from "@/lib/providers/demo";
import type { ProviderContext, ProviderMetrics } from "@/lib/providers/types";

type ConnectionWithRelations = ProviderConnection & {
  site: Site;
  providerType: ProviderType;
};

/**
 * Build a ProviderContext from a DB row — decrypts secrets, parses metadata.
 */
function toContext(conn: ConnectionWithRelations): ProviderContext {
  const metadata =
    conn.metadataJson && typeof conn.metadataJson === "object"
      ? (conn.metadataJson as Record<string, unknown>)
      : {};

  return {
    connectionId: conn.id,
    siteId: conn.siteId,
    providerCode: conn.providerType.code,
    apiBaseUrl: conn.apiBaseUrl,
    externalAccountIdentifier: conn.externalAccountIdentifier,
    accessToken: maybeDecrypt(conn.accessTokenEncrypted),
    refreshToken: maybeDecrypt(conn.refreshTokenEncrypted),
    tokenExpiresAt: conn.tokenExpiresAt,
    metadata: {
      ...metadata,
      kwcInstalled: conn.site.kwcInstalled,
      batteryKwh: conn.site.batteryKwh,
    },
    demoMode: conn.demoMode,
  };
}

/**
 * Run a single connection sync: refresh auth → fetch summary → persist snapshot.
 * Never throws — all errors are captured on the connection row.
 */
export async function syncConnection(connectionId: string): Promise<{
  ok: boolean;
  metrics?: ProviderMetrics;
  error?: string;
}> {
  const conn = await prisma.providerConnection.findUnique({
    where: { id: connectionId },
    include: { site: true, providerType: true },
  });
  if (!conn) return { ok: false, error: "Connection introuvable." };

  const ctx = toContext(conn);
  const adapter = conn.demoMode ? demoAdapter : getAdapter(conn.providerType.code);

  try {
    // 1. Refresh OAuth if needed.
    if (!conn.demoMode) {
      const refreshed = await adapter.refreshAuthIfNeeded(ctx).catch(() => null);
      if (refreshed) {
        await prisma.providerConnection.update({
          where: { id: conn.id },
          data: {
            accessTokenEncrypted: encryptSecret(refreshed.accessToken),
            refreshTokenEncrypted: refreshed.refreshToken
              ? encryptSecret(refreshed.refreshToken)
              : conn.refreshTokenEncrypted,
            tokenExpiresAt: refreshed.expiresAt,
          },
        });
        ctx.accessToken = refreshed.accessToken;
        ctx.refreshToken = refreshed.refreshToken;
        ctx.tokenExpiresAt = refreshed.expiresAt;
      }
    }

    // 2. Fetch summary.
    const summary = await adapter.getSiteSummary(ctx);

    // 3. Persist snapshot.
    await prisma.siteMetricSnapshot.create({
      data: {
        siteId: conn.siteId,
        providerConnectionId: conn.id,
        timestamp: summary.timestamp,
        currentPowerW: summary.metrics.currentPowerW,
        dailyEnergyWh: summary.metrics.dailyEnergyWh,
        monthlyEnergyWh: summary.metrics.monthlyEnergyWh,
        yearlyEnergyWh: summary.metrics.yearlyEnergyWh,
        lifetimeEnergyWh: summary.metrics.lifetimeEnergyWh,
        batterySoc: summary.metrics.batterySoc,
        gridImportW: summary.metrics.gridImportW,
        gridExportW: summary.metrics.gridExportW,
        selfConsumptionPct: summary.metrics.selfConsumptionPct,
        co2SavedKg: summary.metrics.co2SavedKg,
        rawJson: (summary.raw as object | null | undefined) ?? undefined,
      },
    });

    await prisma.providerConnection.update({
      where: { id: conn.id },
      data: {
        status: conn.demoMode ? "DEMO" : "CONNECTED",
        lastSyncAt: new Date(),
        lastError: null,
      },
    });

    return { ok: true, metrics: summary.metrics };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    await prisma.providerConnection.update({
      where: { id: conn.id },
      data: {
        status: "ERROR",
        lastSyncAt: new Date(),
        lastError: message.slice(0, 500),
      },
    });
    return { ok: false, error: message };
  }
}

/** Run every active (non-link-only) connection in parallel. */
export async function syncAllConnections(): Promise<{
  total: number;
  ok: number;
  errors: number;
}> {
  const connections = await prisma.providerConnection.findMany({
    where: {
      status: { in: ["CONNECTED", "PENDING", "ERROR", "DEMO"] },
    },
    select: { id: true },
  });
  const results = await Promise.allSettled(
    connections.map((c: (typeof connections)[number]) => syncConnection(c.id))
  );
  const ok = results.filter(
    (r) => r.status === "fulfilled" && r.value.ok
  ).length;
  return {
    total: connections.length,
    ok,
    errors: connections.length - ok,
  };
}
