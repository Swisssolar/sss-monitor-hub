import type {
  HistoricalPoint,
  ProviderAdapter,
  ProviderContext,
  ProviderMetrics,
  ProviderSiteSummary,
} from "./types";

/**
 * Realistic solar demo-data generator.
 *
 * Produces a diurnal curve anchored to the local clock, seasonal amplitude,
 * and a small stochastic noise. Used in two ways:
 *   1. Connection-level demo mode (admin flips `demoMode` on a connection)
 *   2. Global fallback when `ENABLE_GLOBAL_DEMO_MODE=true` and no adapter
 *      is configured for a site.
 */

const DEFAULT_KWC = 10; // kWc installed — used to scale power output

function seasonalFactor(d: Date): number {
  // Peak in June (day-of-year ~172), min in Dec (~355)
  const dayOfYear = Math.floor(
    (d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86_400_000
  );
  const phase = ((dayOfYear - 172) / 365) * 2 * Math.PI;
  return 0.55 + 0.45 * Math.cos(phase); // 0.10 .. 1.00
}

function diurnalFactor(d: Date): number {
  // Solar noon ~13:30 local in summer, narrower curve in winter
  const h = d.getHours() + d.getMinutes() / 60;
  if (h < 6 || h > 21) return 0;
  const x = (h - 13.5) / 4.2;
  return Math.max(0, Math.exp(-x * x));
}

function jitter(seed: number): number {
  const x = Math.sin(seed) * 10_000;
  return x - Math.floor(x); // deterministic-ish noise 0..1
}

export function generateMetrics(
  kwc: number = DEFAULT_KWC,
  at: Date = new Date()
): ProviderMetrics {
  const season = seasonalFactor(at);
  const diurnal = diurnalFactor(at);
  const noise = 0.85 + 0.3 * jitter(at.getMinutes() + at.getHours() * 7);

  const currentPowerW = Math.round(kwc * 1000 * diurnal * season * noise);

  // Energy today: integrate a typical curve — empirical shortcut
  const dailyEnergyWh = Math.round(kwc * 1000 * season * (4.2 + 1.6 * jitter(at.getDate())));
  const monthlyEnergyWh = Math.round(dailyEnergyWh * (at.getDate() + 0.5));
  const yearlyEnergyWh = Math.round(
    kwc * 1000 * (950 + 120 * jitter(at.getMonth() + 1))
  );
  const lifetimeEnergyWh = Math.round(yearlyEnergyWh * (3 + jitter(kwc) * 2));

  const batterySoc = Math.max(
    12,
    Math.min(98, Math.round(55 + 35 * Math.sin(at.getHours() / 24 * Math.PI * 2)))
  );

  const gridExportW = Math.max(0, Math.round(currentPowerW * 0.35 * noise));
  const gridImportW = currentPowerW < 200 ? Math.round(400 * noise) : 0;

  const selfConsumptionPct = 55 + Math.round(15 * jitter(at.getHours()));
  const co2SavedKg = Math.round((lifetimeEnergyWh / 1000) * 0.128);

  return {
    currentPowerW,
    dailyEnergyWh,
    monthlyEnergyWh,
    yearlyEnergyWh,
    lifetimeEnergyWh,
    batterySoc,
    gridImportW,
    gridExportW,
    selfConsumptionPct,
    co2SavedKg,
  };
}

export function generateHistory(
  kwc: number,
  from: Date,
  to: Date,
  stepMinutes = 15
): HistoricalPoint[] {
  const points: HistoricalPoint[] = [];
  let cursor = new Date(from);
  while (cursor <= to) {
    const m = generateMetrics(kwc, cursor);
    points.push({
      timestamp: new Date(cursor),
      powerW: m.currentPowerW,
      energyWh: m.currentPowerW !== null ? (m.currentPowerW * stepMinutes) / 60 : null,
    });
    cursor = new Date(cursor.getTime() + stepMinutes * 60 * 1000);
  }
  return points;
}

/** Minimal adapter used when a connection is in demo mode or as a global fallback. */
export const demoAdapter: ProviderAdapter = {
  code: "GENERIC_LINK",
  displayName: "Démo Swiss Solar System",
  async getConnectionStatus() {
    return { ok: true };
  },
  async getSiteSummary(ctx: ProviderContext): Promise<ProviderSiteSummary> {
    const kwc = (ctx.metadata.kwcInstalled as number | undefined) ?? DEFAULT_KWC;
    return {
      externalId: ctx.externalAccountIdentifier,
      externalName: null,
      metrics: generateMetrics(kwc),
      timestamp: new Date(),
    };
  },
  async getLatestMetrics(ctx) {
    return (await this.getSiteSummary(ctx)).metrics;
  },
  async getHistoricalMetrics(ctx, { from, to }) {
    const kwc = (ctx.metadata.kwcInstalled as number | undefined) ?? DEFAULT_KWC;
    return generateHistory(kwc, from, to);
  },
  getLaunchUrl() {
    return null;
  },
  async refreshAuthIfNeeded() {
    return null;
  },
};
