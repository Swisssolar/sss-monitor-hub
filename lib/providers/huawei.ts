import type {
  HistoricalPoint,
  ProviderAdapter,
  ProviderContext,
  ProviderSiteSummary,
} from "./types";
import { ProviderNotConfiguredError } from "./types";

/**
 * Huawei FusionSolar Northbound API adapter.
 *
 * The Northbound API requires a company-level API account (not the installer
 * app). Until Swiss Solar System obtains API credentials from Huawei, this
 * adapter reports a "Configuration requise" status and falls through to the
 * generic portal-launch behaviour.
 *
 * When credentials are available:
 *   1. Admin saves username + password on the ProviderConnection (encrypted).
 *   2. The sync service logs in via POST /thirdData/login, stores the
 *      XSRF-TOKEN as the access token (encrypted).
 *   3. Data endpoints:
 *        POST /thirdData/getStationList
 *        POST /thirdData/getKpiStationDay
 *        POST /thirdData/getStationRealKpi
 */

function huaweiIsConfigured(ctx: ProviderContext): boolean {
  return Boolean(ctx.apiBaseUrl && ctx.accessToken);
}

export const huaweiAdapter: ProviderAdapter = {
  code: "HUAWEI",
  displayName: "Huawei FusionSolar",

  async getConnectionStatus(ctx) {
    if (!huaweiIsConfigured(ctx)) {
      return {
        ok: false,
        reason:
          "Compte API Huawei FusionSolar non configuré. Utiliser le portail externe en attendant.",
      };
    }
    return { ok: true };
  },

  async getSiteSummary(ctx: ProviderContext): Promise<ProviderSiteSummary> {
    if (!huaweiIsConfigured(ctx)) {
      throw new ProviderNotConfiguredError(
        "Huawei FusionSolar: credentials API non configurés."
      );
    }
    // TODO: implement real calls once API account is provisioned.
    throw new ProviderNotConfiguredError(
      "Intégration Huawei FusionSolar en cours — utiliser le portail officiel."
    );
  },

  async getLatestMetrics(ctx) {
    const summary = await this.getSiteSummary(ctx);
    return summary.metrics;
  },

  async getHistoricalMetrics(): Promise<HistoricalPoint[]> {
    return [];
  },

  getLaunchUrl(ctx) {
    return ctx.apiBaseUrl ?? "https://eu5.fusionsolar.huawei.com";
  },

  async refreshAuthIfNeeded() {
    return null;
  },
};
