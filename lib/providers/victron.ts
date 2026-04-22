import type {
  HistoricalPoint,
  ProviderAdapter,
  ProviderContext,
  ProviderMetrics,
  ProviderSiteSummary,
} from "./types";
import { ProviderNotConfiguredError } from "./types";

/**
 * Victron VRM adapter.
 *
 * Auth flow: POST /v2/auth/login with {username, password} → returns a bearer
 * token which we encrypt and store in `accessTokenEncrypted`.
 *
 * Key endpoints used:
 *   GET /v2/users/me                                  → user.idUser
 *   GET /v2/users/{idUser}/installations              → list installations
 *   GET /v2/installations/{idSite}/stats?type=…       → current + historical
 *   GET /v2/installations/{idSite}/overallstats       → lifetime totals
 *
 * The site's VRM `idSite` is stored in `externalAccountIdentifier`.
 *
 * NOTE: VRM imposes rate-limits on the login endpoint. The adapter refreshes
 * tokens only when expired and reuses them across sync jobs.
 */

const VRM_BASE = "https://vrmapi.victronenergy.com";
const TOKEN_LIFETIME_MS = 60 * 60 * 1000; // ~1h, VRM tokens last longer but we refresh conservatively

async function vrmFetch<T>(
  path: string,
  token: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${VRM_BASE}${path}`, {
    ...init,
    headers: {
      "X-Authorization": `Bearer ${token}`,
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`VRM ${path} HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

interface VrmStatsResponse {
  success: boolean;
  records?: {
    data?: Record<string, Array<[number, number]>>;
    totals?: Record<string, number>;
  };
}

function latestNumber(series: Array<[number, number]> | undefined): number | null {
  if (!series || !series.length) return null;
  const last = series[series.length - 1];
  return typeof last[1] === "number" ? last[1] : null;
}

export const victronAdapter: ProviderAdapter = {
  code: "VICTRON",
  displayName: "Victron VRM",

  async getConnectionStatus(ctx) {
    if (!ctx.accessToken) {
      return { ok: false, reason: "Token VRM manquant — reconnecter le compte." };
    }
    if (!ctx.externalAccountIdentifier) {
      return { ok: false, reason: "Installation VRM non sélectionnée." };
    }
    try {
      await vrmFetch(`/v2/installations/${ctx.externalAccountIdentifier}/stats?type=live_feed`, ctx.accessToken);
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: e instanceof Error ? e.message : "VRM injoignable." };
    }
  },

  async getSiteSummary(ctx: ProviderContext): Promise<ProviderSiteSummary> {
    if (!ctx.accessToken || !ctx.externalAccountIdentifier) {
      throw new ProviderNotConfiguredError("Victron: token ou idSite manquant.");
    }

    const id = ctx.externalAccountIdentifier;

    const [live, kwh] = await Promise.all([
      vrmFetch<VrmStatsResponse>(`/v2/installations/${id}/stats?type=live_feed`, ctx.accessToken),
      vrmFetch<VrmStatsResponse>(`/v2/installations/${id}/stats?type=kwh&interval=days`, ctx.accessToken),
    ]);

    const liveData = live.records?.data ?? {};
    const kwhTotals = kwh.records?.totals ?? {};

    const currentPowerW = latestNumber(liveData["Pdc"]) ?? latestNumber(liveData["Pinverter"]);
    const batterySoc = latestNumber(liveData["bs"]) ?? latestNumber(liveData["SOC"]);
    const gridPower = latestNumber(liveData["Pg"]);

    const metrics: ProviderMetrics = {
      currentPowerW,
      dailyEnergyWh: kwhTotals["solar_yield"] ? kwhTotals["solar_yield"] * 1000 : null,
      monthlyEnergyWh: null,
      yearlyEnergyWh: null,
      lifetimeEnergyWh: null,
      batterySoc,
      gridImportW: gridPower !== null && gridPower > 0 ? gridPower : gridPower === null ? null : 0,
      gridExportW: gridPower !== null && gridPower < 0 ? -gridPower : gridPower === null ? null : 0,
      selfConsumptionPct: null,
      co2SavedKg: null,
    };

    return {
      externalId: id,
      externalName: null,
      metrics,
      timestamp: new Date(),
      raw: { live, kwh },
    };
  },

  async getLatestMetrics(ctx) {
    return (await this.getSiteSummary(ctx)).metrics;
  },

  async getHistoricalMetrics(): Promise<HistoricalPoint[]> {
    // Available via /stats?type=kwh&interval=hours — mappable later.
    return [];
  },

  getLaunchUrl(ctx) {
    if (ctx.externalAccountIdentifier) {
      return `https://vrm.victronenergy.com/installation/${ctx.externalAccountIdentifier}/dashboard`;
    }
    return "https://vrm.victronenergy.com";
  },

  async refreshAuthIfNeeded(ctx) {
    if (!ctx.tokenExpiresAt) return null;
    if (Date.now() < ctx.tokenExpiresAt.getTime() - 2 * 60 * 1000) return null;

    // VRM does not provide a refresh-token grant — we need to re-login using
    // the service credentials. This is delegated to the admin UI when expired.
    // Return null; sync service will mark connection as ERROR and surface a
    // "reconnect needed" badge.
    return null;
  },
};

/**
 * Helper used by the admin "Connect" flow. Call once, then persist the
 * encrypted token on the connection row.
 */
export async function victronLogin(
  username: string,
  password: string
): Promise<{ token: string; expiresAt: Date; idUser: number }> {
  const res = await fetch(`${VRM_BASE}/v2/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    throw new Error(`VRM login failed: HTTP ${res.status}`);
  }
  const data = (await res.json()) as { token: string; idUser: number };
  return {
    token: data.token,
    expiresAt: new Date(Date.now() + TOKEN_LIFETIME_MS),
    idUser: data.idUser,
  };
}
