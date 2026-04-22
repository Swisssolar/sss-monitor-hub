import {
  formatCo2Kg,
  formatEnergyWh,
  formatPercent,
  formatPowerW,
} from "@/lib/format";
import type { SiteDetailView } from "@/lib/services/sites";

interface Metric {
  label: string;
  value: string;
  live?: boolean;
  hint?: string;
}

function Tile({ m, i }: { m: Metric; i: number }) {
  return (
    <div
      className="px-5 py-6 border-r border-b border-swiss-line last:border-r md:[&:nth-child(3n)]:border-r-0"
      style={{ ["--i" as string]: i }}
    >
      <div className="eyebrow flex items-center gap-1.5">
        {m.live ? <span className="live-dot" aria-hidden /> : null}
        {m.label}
      </div>
      <div className="mt-2 metric-figure text-[44px] md:text-[52px]">
        {m.value}
      </div>
      {m.hint ? (
        <div className="mt-1 text-[12px] text-swiss-mute">{m.hint}</div>
      ) : null}
    </div>
  );
}

export function MetricsGrid({ site }: { site: SiteDetailView }) {
  const gridBalance =
    site.gridExportW != null && site.gridImportW != null
      ? site.gridExportW - site.gridImportW
      : null;

  const metrics: Metric[] = [
    {
      label: "Production instantanée",
      value: formatPowerW(site.currentPowerW),
      live: (site.currentPowerW ?? 0) > 50,
    },
    {
      label: "Énergie du jour",
      value: formatEnergyWh(site.dailyEnergyWh),
    },
    {
      label: "Batterie",
      value: formatPercent(site.batterySoc),
      hint:
        site.batteryKwh != null
          ? `${site.batteryKwh.toFixed(1)} kWh installés`
          : undefined,
    },
    {
      label: "Énergie du mois",
      value: formatEnergyWh(site.monthlyEnergyWh),
    },
    {
      label: "Autoconsommation",
      value: formatPercent(site.selfConsumptionPct),
    },
    {
      label: "Balance réseau",
      value: formatPowerW(gridBalance),
      hint:
        gridBalance != null
          ? gridBalance > 0
            ? "Injection vers le réseau"
            : gridBalance < 0
            ? "Soutirage depuis le réseau"
            : "Équilibre"
          : undefined,
    },
    {
      label: "Énergie annuelle",
      value: formatEnergyWh(site.yearlyEnergyWh),
    },
    {
      label: "Production totale",
      value: formatEnergyWh(site.lifetimeEnergyWh),
    },
    {
      label: "CO₂ évité",
      value: formatCo2Kg(site.co2SavedKg),
    },
  ];

  return (
    <div className="bg-white border-t border-l border-swiss-line grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 rounded-sm stagger">
      {metrics.map((m, i) => (
        <Tile key={m.label} m={m} i={i} />
      ))}
    </div>
  );
}
