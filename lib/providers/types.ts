import type { ProviderCode } from "@prisma/client";

/**
 * Unified metrics shape returned by every provider adapter.
 * Any field may be null when the provider does not expose it.
 */
export interface ProviderMetrics {
  currentPowerW: number | null;
  dailyEnergyWh: number | null;
  monthlyEnergyWh: number | null;
  yearlyEnergyWh: number | null;
  lifetimeEnergyWh: number | null;
  batterySoc: number | null;
  gridImportW: number | null;
  gridExportW: number | null;
  selfConsumptionPct: number | null;
  co2SavedKg: number | null;
}

export interface ProviderSiteSummary {
  externalId: string | null;
  externalName: string | null;
  metrics: ProviderMetrics;
  timestamp: Date;
  raw?: unknown;
}

export interface HistoricalPoint {
  timestamp: Date;
  powerW: number | null;
  energyWh: number | null;
}

export type ConnectionHealth =
  | { ok: true }
  | { ok: false; reason: string };

/**
 * Context provided by the sync service to every adapter call.
 * The adapter receives already-decrypted tokens and per-connection config.
 */
export interface ProviderContext {
  connectionId: string;
  siteId: string;
  providerCode: ProviderCode;

  apiBaseUrl: string | null;
  externalAccountIdentifier: string | null;

  /** Decrypted. Never pass encrypted values into adapters. */
  accessToken: string | null;
  /** Decrypted. */
  refreshToken: string | null;
  tokenExpiresAt: Date | null;

  metadata: Record<string, unknown>;

  /** Whether demo mode is active for this connection. */
  demoMode: boolean;
}

/**
 * The contract every provider adapter must implement.
 *
 * Adapters are stateless. The sync service instantiates them per call,
 * passing the decrypted `ProviderContext`.
 */
export interface ProviderAdapter {
  readonly code: ProviderCode;
  readonly displayName: string;

  /** Quick health-check, without fetching the full payload. */
  getConnectionStatus(ctx: ProviderContext): Promise<ConnectionHealth>;

  /** Latest site summary — used to refresh the dashboard tiles. */
  getSiteSummary(ctx: ProviderContext): Promise<ProviderSiteSummary>;

  /** Alias for getSiteSummary().metrics — convenience. */
  getLatestMetrics(ctx: ProviderContext): Promise<ProviderMetrics>;

  /** Rolling history (e.g. last 24h) in 5–15 min buckets. */
  getHistoricalMetrics(
    ctx: ProviderContext,
    opts: { from: Date; to: Date }
  ): Promise<HistoricalPoint[]>;

  /** External portal URL for this site — always available (fallback mode). */
  getLaunchUrl(ctx: ProviderContext): string | null;

  /**
   * Refresh the OAuth access token if needed. Returns new encrypted values
   * that the sync service will persist, or null if no refresh happened.
   */
  refreshAuthIfNeeded(ctx: ProviderContext): Promise<{
    accessToken: string;
    refreshToken: string | null;
    expiresAt: Date;
  } | null>;
}

export class ProviderNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderNotConfiguredError";
  }
}
