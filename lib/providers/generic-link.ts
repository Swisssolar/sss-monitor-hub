import type {
  HistoricalPoint,
  ProviderAdapter,
  ProviderContext,
  ProviderMetrics,
  ProviderSiteSummary,
} from "./types";

/**
 * GenericLink fallback adapter.
 *
 * Does not fetch any metrics — the admin configures an external portal URL
 * per site, and the client simply "launches" the provider UI in a new tab.
 *
 * Used for providers we have not yet integrated (or never will), and as a
 * graceful degradation path when a direct integration fails.
 */
export const genericLinkAdapter: ProviderAdapter = {
  code: "GENERIC_LINK",
  displayName: "Portail externe",

  async getConnectionStatus(ctx) {
    if (!ctx.apiBaseUrl) {
      return { ok: false, reason: "URL du portail non configurée." };
    }
    return { ok: true };
  },

  async getSiteSummary(ctx: ProviderContext): Promise<ProviderSiteSummary> {
    const emptyMetrics: ProviderMetrics = {
      currentPowerW: null,
      dailyEnergyWh: null,
      monthlyEnergyWh: null,
      yearlyEnergyWh: null,
      lifetimeEnergyWh: null,
      batterySoc: null,
      gridImportW: null,
      gridExportW: null,
      selfConsumptionPct: null,
      co2SavedKg: null,
    };
    return {
      externalId: ctx.externalAccountIdentifier,
      externalName: null,
      metrics: emptyMetrics,
      timestamp: new Date(),
    };
  },

  async getLatestMetrics(ctx) {
    return (await this.getSiteSummary(ctx)).metrics;
  },

  async getHistoricalMetrics(): Promise<HistoricalPoint[]> {
    return [];
  },

  getLaunchUrl(ctx) {
    return ctx.apiBaseUrl;
  },

  async refreshAuthIfNeeded() {
    return null;
  },
};
