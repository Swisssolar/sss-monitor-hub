import type {
  HistoricalPoint,
  ProviderAdapter,
  ProviderContext,
  ProviderMetrics,
  ProviderSiteSummary,
} from "./types";
import { ProviderNotConfiguredError } from "./types";

/**
 * Enphase Enlighten adapter (OAuth 2.0 + api_key).
 *
 * Auth flow (managed by /app/api/providers/enphase/callback/route.ts):
 *   1. Admin clicks "Connecter" → redirected to
 *      https://api.enphaseenergy.com/oauth/authorize?response_type=code&client_id=…&redirect_uri=…
 *   2. Enphase redirects back with ?code=… → exchanged for access + refresh
 *      token at https://api.enphaseenergy.com/oauth/token
 *   3. Tokens encrypted (AES-256-GCM) and stored on the ProviderConnection.
 *
 * All Enphase data endpoints require BOTH a Bearer access token AND an
 * api_key query parameter (from ENPHASE_API_KEY).
 *
 * Key endpoints used:
 *   GET /api/v4/systems                              → list systems
 *   GET /api/v4/systems/{system_id}/summary          → current power + daily
 *   GET /api/v4/systems/{system_id}/telemetry/production_micro
 *
 * If ENPHASE_CLIENT_ID / ENPHASE_CLIENT_SECRET / ENPHASE_API_KEY are not
 * configured the adapter surfaces a clear "Configuration requise" status.
 */

const ENPHASE_AUTH_BASE = "https://api.enphaseenergy.com/oauth";
const ENPHASE_API_BASE = "https://api.enphaseenergy.com/api/v4";

export function enphaseIsConfigured(): boolean {
  return Boolean(
    process.env.ENPHASE_CLIENT_ID &&
      process.env.ENPHASE_CLIENT_SECRET &&
      process.env.ENPHASE_API_KEY
  );
}

export function enphaseAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.ENPHASE_CLIENT_ID ?? "",
    redirect_uri:
      process.env.ENPHASE_REDIRECT_URI ??
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/providers/enphase/callback`,
    state,
  });
  return `${ENPHASE_AUTH_BASE}/authorize?${params}`;
}

export async function enphaseExchangeCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}> {
  const redirectUri =
    process.env.ENPHASE_REDIRECT_URI ??
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/providers/enphase/callback`;

  const basic = Buffer.from(
    `${process.env.ENPHASE_CLIENT_ID}:${process.env.ENPHASE_CLIENT_SECRET}`
  ).toString("base64");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const res = await fetch(`${ENPHASE_AUTH_BASE}/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    throw new Error(`Enphase token exchange HTTP ${res.status}`);
  }
  const json = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: new Date(Date.now() + (json.expires_in ?? 3600) * 1000),
  };
}

async function enphaseFetch<T>(path: string, accessToken: string): Promise<T> {
  const sep = path.includes("?") ? "&" : "?";
  const url = `${ENPHASE_API_BASE}${path}${sep}key=${process.env.ENPHASE_API_KEY}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) {
    throw new Error(`Enphase ${path} HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

interface EnphaseSummary {
  current_power?: number; // W
  energy_today?: number; // Wh
  energy_lifetime?: number; // Wh
  last_interval_end_at?: number; // epoch seconds
}

export const enphaseAdapter: ProviderAdapter = {
  code: "ENPHASE",
  displayName: "Enphase Enlighten",

  async getConnectionStatus(ctx) {
    if (!enphaseIsConfigured()) {
      return {
        ok: false,
        reason: "Configuration Enphase (client_id / api_key) manquante côté admin.",
      };
    }
    if (!ctx.accessToken) {
      return { ok: false, reason: "Non connecté — cliquer sur « Connecter Enphase »." };
    }
    if (!ctx.externalAccountIdentifier) {
      return { ok: false, reason: "Système Enphase non sélectionné pour ce site." };
    }
    return { ok: true };
  },

  async getSiteSummary(ctx: ProviderContext): Promise<ProviderSiteSummary> {
    if (!enphaseIsConfigured()) {
      throw new ProviderNotConfiguredError("Enphase non configuré.");
    }
    if (!ctx.accessToken || !ctx.externalAccountIdentifier) {
      throw new ProviderNotConfiguredError("Enphase: token ou system_id manquant.");
    }

    const summary = await enphaseFetch<EnphaseSummary>(
      `/systems/${ctx.externalAccountIdentifier}/summary`,
      ctx.accessToken
    );

    const metrics: ProviderMetrics = {
      currentPowerW: summary.current_power ?? null,
      dailyEnergyWh: summary.energy_today ?? null,
      monthlyEnergyWh: null,
      yearlyEnergyWh: null,
      lifetimeEnergyWh: summary.energy_lifetime ?? null,
      batterySoc: null, // Enphase battery metrics live on /battery endpoint
      gridImportW: null,
      gridExportW: null,
      selfConsumptionPct: null,
      co2SavedKg:
        summary.energy_lifetime != null
          ? Math.round((summary.energy_lifetime / 1000) * 0.128)
          : null,
    };

    return {
      externalId: ctx.externalAccountIdentifier,
      externalName: null,
      metrics,
      timestamp: new Date((summary.last_interval_end_at ?? Date.now() / 1000) * 1000),
      raw: summary,
    };
  },

  async getLatestMetrics(ctx) {
    return (await this.getSiteSummary(ctx)).metrics;
  },

  async getHistoricalMetrics(): Promise<HistoricalPoint[]> {
    // TODO: /systems/{id}/telemetry/production_micro — pagination required.
    return [];
  },

  getLaunchUrl(ctx) {
    if (ctx.externalAccountIdentifier) {
      return `https://enlighten.enphaseenergy.com/systems/${ctx.externalAccountIdentifier}`;
    }
    return "https://enlighten.enphaseenergy.com";
  },

  async refreshAuthIfNeeded(ctx) {
    if (!ctx.refreshToken || !ctx.tokenExpiresAt) return null;
    if (Date.now() < ctx.tokenExpiresAt.getTime() - 2 * 60 * 1000) return null;

    const basic = Buffer.from(
      `${process.env.ENPHASE_CLIENT_ID}:${process.env.ENPHASE_CLIENT_SECRET}`
    ).toString("base64");

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: ctx.refreshToken,
    });

    const res = await fetch(`${ENPHASE_AUTH_BASE}/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    if (!res.ok) {
      throw new Error(`Enphase refresh HTTP ${res.status}`);
    }
    const data = (await res.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  },
};
