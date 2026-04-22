import type {
  HistoricalPoint,
  ProviderAdapter,
  ProviderContext,
  ProviderMetrics,
  ProviderSiteSummary,
} from "./types";
import { ProviderNotConfiguredError } from "./types";

/**
 * Fronius Solar.API adapter.
 *
 * Fronius inverters and Fronius Datamanager gateways expose a local HTTP JSON
 * API (default: http://<gateway>/solar_api/v1/...). The adapter targets:
 *   - GetPowerFlowRealtimeData.fcgi   → current PV / battery / grid power
 *   - GetInverterRealtimeData.cgi     → daily/yearly energy counters
 *
 * The gateway URL is stored per-connection in `apiBaseUrl`.
 * No cloud credentials are required for local LAN access.
 *
 * For remote access via Fronius Solar.web the gateway must be reachable
 * (VPN or a public tunnel). If you prefer the cloud API instead, swap
 * the fetch block for the Solar.web endpoint — the returned shape is
 * already aligned with our `ProviderMetrics`.
 */

interface PowerFlowResponse {
  Body?: {
    Data?: {
      Site?: {
        P_PV?: number | null;       // Watts
        P_Grid?: number | null;     // + import / − export
        P_Akku?: number | null;     // + discharge / − charge
        E_Day?: number | null;      // Wh
        E_Year?: number | null;     // Wh
        E_Total?: number | null;    // Wh
        rel_Autonomy?: number | null;
        rel_SelfConsumption?: number | null;
      };
      Inverters?: Record<string, { SOC?: number | null }>;
    };
  };
}

async function fetchPowerFlow(baseUrl: string): Promise<PowerFlowResponse> {
  const url = new URL("solar_api/v1/GetPowerFlowRealtimeData.fcgi", ensureTrailingSlash(baseUrl));
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    // Local API — keep the timeout tight.
    signal: AbortSignal.timeout(8_000),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Fronius power-flow HTTP ${res.status}`);
  }
  return (await res.json()) as PowerFlowResponse;
}

function ensureTrailingSlash(u: string): string {
  return u.endsWith("/") ? u : `${u}/`;
}

function toMetrics(raw: PowerFlowResponse): ProviderMetrics {
  const site = raw.Body?.Data?.Site ?? {};
  const inverters = raw.Body?.Data?.Inverters ?? {};
  const firstSoc = Object.values(inverters)[0]?.SOC ?? null;

  const gridPower = site.P_Grid ?? null;

  return {
    currentPowerW: site.P_PV ?? null,
    dailyEnergyWh: site.E_Day ?? null,
    monthlyEnergyWh: null, // Fronius local does not expose monthly counters
    yearlyEnergyWh: site.E_Year ?? null,
    lifetimeEnergyWh: site.E_Total ?? null,
    batterySoc: firstSoc,
    gridImportW: gridPower !== null && gridPower > 0 ? gridPower : gridPower === null ? null : 0,
    gridExportW: gridPower !== null && gridPower < 0 ? -gridPower : gridPower === null ? null : 0,
    selfConsumptionPct: site.rel_SelfConsumption ?? null,
    co2SavedKg:
      site.E_Total != null ? Math.round((site.E_Total / 1000) * 0.128) : null,
  };
}

export const froniusAdapter: ProviderAdapter = {
  code: "FRONIUS",
  displayName: "Fronius",

  async getConnectionStatus(ctx) {
    if (!ctx.apiBaseUrl) {
      return { ok: false, reason: "URL locale de la Datamanager non configurée." };
    }
    try {
      await fetchPowerFlow(ctx.apiBaseUrl);
      return { ok: true };
    } catch (e) {
      return {
        ok: false,
        reason: e instanceof Error ? e.message : "Passerelle Fronius injoignable.",
      };
    }
  },

  async getSiteSummary(ctx: ProviderContext): Promise<ProviderSiteSummary> {
    if (!ctx.apiBaseUrl) {
      throw new ProviderNotConfiguredError("Fronius: apiBaseUrl manquant.");
    }
    const raw = await fetchPowerFlow(ctx.apiBaseUrl);
    return {
      externalId: ctx.externalAccountIdentifier,
      externalName: null,
      metrics: toMetrics(raw),
      timestamp: new Date(),
      raw,
    };
  },

  async getLatestMetrics(ctx) {
    return (await this.getSiteSummary(ctx)).metrics;
  },

  async getHistoricalMetrics(): Promise<HistoricalPoint[]> {
    // TODO: implement /GetArchiveData.cgi? Query=CumulationInverterData
    // For the MVP we rely on the SiteMetricSnapshot history recorded by
    // our own sync service — sufficient for the production chart.
    return [];
  },

  getLaunchUrl(ctx) {
    // Fronius Solar.web; fall back to local gateway if no cloud link configured.
    const cloud = (ctx.metadata.solarWebUrl as string | undefined) ?? null;
    return cloud ?? ctx.apiBaseUrl;
  },

  async refreshAuthIfNeeded() {
    // Local API requires no auth refresh.
    return null;
  },
};
