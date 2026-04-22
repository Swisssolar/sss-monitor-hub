import { prisma } from "@/lib/prisma";
import { generateHistory, generateMetrics } from "@/lib/providers/demo";
import type { ConnectionStatus, ProviderCode } from "@prisma/client";

const GLOBAL_DEMO = process.env.ENABLE_GLOBAL_DEMO_MODE === "true";

export interface SiteCardView {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  kwcInstalled: number | null;
  batteryKwh: number | null;
  providerPrimary: ProviderCode | null;
  externalPortalUrl: string | null;

  currentPowerW: number | null;
  dailyEnergyWh: number | null;
  batterySoc: number | null;
  lastUpdateAt: Date | null;

  connectionStatus: ConnectionStatus | "NONE";
  isDemo: boolean;
}

/**
 * List all sites the user may access, with the latest metrics for each.
 *
 * If ENABLE_GLOBAL_DEMO_MODE is on and no live snapshot exists for a site,
 * synthetic metrics are injected *at read time only* — not persisted. This
 * keeps the demo UX smooth without polluting historical data.
 */
export async function listSitesForUser(userId: string): Promise<SiteCardView[]> {
  const memberships = await prisma.membership.findMany({
    where: { userId },
    select: { organizationId: true },
  });
  const orgIds = memberships.map((m: (typeof memberships)[number]) => m.organizationId);
  if (!orgIds.length) return [];

  const sites = await prisma.site.findMany({
    where: { organizationId: { in: orgIds } },
    include: {
      connections: {
        orderBy: { createdAt: "asc" },
        take: 1,
        select: {
          status: true,
          demoMode: true,
          lastSyncAt: true,
          lastError: true,
        },
      },
      metrics: {
        orderBy: { timestamp: "desc" },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  return sites.map((s: (typeof sites)[number]) => {
    const latest = s.metrics[0];
    const conn = s.connections[0];

    const connectionStatus: ConnectionStatus | "NONE" = conn?.status ?? "NONE";
    const hasNoLiveData = !latest;
    const shouldSynthesize =
      hasNoLiveData && (GLOBAL_DEMO || conn?.demoMode);

    const synth = shouldSynthesize
      ? generateMetrics(s.kwcInstalled ?? 10)
      : null;

    return {
      id: s.id,
      name: s.name,
      address: s.address,
      city: s.city,
      kwcInstalled: s.kwcInstalled,
      batteryKwh: s.batteryKwh,
      providerPrimary: s.providerPrimary,
      externalPortalUrl: s.externalPortalUrl,
      currentPowerW: latest?.currentPowerW ?? synth?.currentPowerW ?? null,
      dailyEnergyWh: latest?.dailyEnergyWh ?? synth?.dailyEnergyWh ?? null,
      batterySoc: latest?.batterySoc ?? synth?.batterySoc ?? null,
      lastUpdateAt: latest?.timestamp ?? null,
      connectionStatus,
      isDemo: Boolean(conn?.demoMode) || (shouldSynthesize && !conn),
    };
  });
}

export interface SiteDetailView extends SiteCardView {
  postalCode: string | null;
  organizationName: string;
  monthlyEnergyWh: number | null;
  yearlyEnergyWh: number | null;
  lifetimeEnergyWh: number | null;
  gridImportW: number | null;
  gridExportW: number | null;
  selfConsumptionPct: number | null;
  co2SavedKg: number | null;
  connections: Array<{
    id: string;
    code: ProviderCode;
    displayName: string;
    status: ConnectionStatus;
    demoMode: boolean;
    lastSyncAt: Date | null;
    lastError: string | null;
    launchUrl: string | null;
  }>;
  productionSeries: Array<{ t: string; w: number }>;
}

export async function getSiteDetail(
  siteId: string,
  userId: string,
  isAdmin: boolean
): Promise<SiteDetailView | null> {
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    include: {
      organization: true,
      connections: { include: { providerType: true } },
      metrics: { orderBy: { timestamp: "desc" }, take: 1 },
    },
  });
  if (!site) return null;

  if (!isAdmin) {
    const membership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: site.organizationId,
        },
      },
    });
    if (!membership) return null;
  }

  const latest = site.metrics[0];
  const hasDemoConn = site.connections.some((c: (typeof site.connections)[number]) => c.demoMode);
  const noLiveData = !latest;
  const shouldSynthesize = noLiveData && (GLOBAL_DEMO || hasDemoConn);

  const synth = shouldSynthesize
    ? generateMetrics(site.kwcInstalled ?? 10)
    : null;

  // Build production series for the chart: last 24h of snapshots, or synth.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const series = await prisma.siteMetricSnapshot.findMany({
    where: { siteId: site.id, timestamp: { gte: since } },
    orderBy: { timestamp: "asc" },
    select: { timestamp: true, currentPowerW: true },
  });

  const productionSeries =
    series.length > 4
      ? series.map((p: (typeof series)[number]) => ({
          t: p.timestamp.toISOString(),
          w: Math.max(0, p.currentPowerW ?? 0),
        }))
      : shouldSynthesize
      ? generateHistory(site.kwcInstalled ?? 10, since, new Date(), 20).map((p) => ({
          t: p.timestamp.toISOString(),
          w: Math.max(0, p.powerW ?? 0),
        }))
      : [];

  const firstConn = site.connections[0];
  return {
    id: site.id,
    name: site.name,
    address: site.address,
    city: site.city,
    postalCode: site.postalCode,
    kwcInstalled: site.kwcInstalled,
    batteryKwh: site.batteryKwh,
    providerPrimary: site.providerPrimary,
    externalPortalUrl: site.externalPortalUrl,
    organizationName: site.organization.name,
    currentPowerW: latest?.currentPowerW ?? synth?.currentPowerW ?? null,
    dailyEnergyWh: latest?.dailyEnergyWh ?? synth?.dailyEnergyWh ?? null,
    monthlyEnergyWh: latest?.monthlyEnergyWh ?? synth?.monthlyEnergyWh ?? null,
    yearlyEnergyWh: latest?.yearlyEnergyWh ?? synth?.yearlyEnergyWh ?? null,
    lifetimeEnergyWh: latest?.lifetimeEnergyWh ?? synth?.lifetimeEnergyWh ?? null,
    batterySoc: latest?.batterySoc ?? synth?.batterySoc ?? null,
    gridImportW: latest?.gridImportW ?? synth?.gridImportW ?? null,
    gridExportW: latest?.gridExportW ?? synth?.gridExportW ?? null,
    selfConsumptionPct: latest?.selfConsumptionPct ?? synth?.selfConsumptionPct ?? null,
    co2SavedKg: latest?.co2SavedKg ?? synth?.co2SavedKg ?? null,
    lastUpdateAt: latest?.timestamp ?? null,
    connectionStatus: firstConn?.status ?? "NONE",
    isDemo: hasDemoConn || (shouldSynthesize && !firstConn),
    connections: site.connections.map((c: (typeof site.connections)[number]) => ({
      id: c.id,
      code: c.providerType.code,
      displayName: c.providerType.displayName,
      status: c.status,
      demoMode: c.demoMode,
      lastSyncAt: c.lastSyncAt,
      lastError: c.lastError,
      launchUrl: c.apiBaseUrl || site.externalPortalUrl,
    })),
    productionSeries,
  };
}
