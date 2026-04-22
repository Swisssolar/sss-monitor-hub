const NBSP = "\u202f"; // narrow non-breaking space (Swiss/French thousands separator)

const nfCh = new Intl.NumberFormat("fr-CH", { maximumFractionDigits: 1 });
const nfInt = new Intl.NumberFormat("fr-CH", { maximumFractionDigits: 0 });

export function formatPowerW(w: number | null | undefined): string {
  if (w == null) return "—";
  if (Math.abs(w) >= 1000) return `${nfCh.format(w / 1000)}${NBSP}kW`;
  return `${nfInt.format(w)}${NBSP}W`;
}

export function formatEnergyWh(wh: number | null | undefined): string {
  if (wh == null) return "—";
  if (Math.abs(wh) >= 1_000_000) return `${nfCh.format(wh / 1_000_000)}${NBSP}MWh`;
  if (Math.abs(wh) >= 1000) return `${nfCh.format(wh / 1000)}${NBSP}kWh`;
  return `${nfInt.format(wh)}${NBSP}Wh`;
}

export function formatPercent(p: number | null | undefined): string {
  if (p == null) return "—";
  return `${nfInt.format(p)}${NBSP}%`;
}

export function formatKwc(kwc: number | null | undefined): string {
  if (kwc == null) return "—";
  return `${nfCh.format(kwc)}${NBSP}kWc`;
}

export function formatKwh(kwh: number | null | undefined): string {
  if (kwh == null) return "—";
  return `${nfCh.format(kwh)}${NBSP}kWh`;
}

/** "il y a 3 min" — minimal relative time, robust for dashboard tiles. */
export function formatRelative(d: Date | null | undefined): string {
  if (!d) return "jamais";
  const now = Date.now();
  const diffSec = Math.floor((now - d.getTime()) / 1000);
  if (diffSec < 30) return "à l'instant";
  if (diffSec < 60) return `il y a ${diffSec}${NBSP}s`;
  const m = Math.floor(diffSec / 60);
  if (m < 60) return `il y a ${m}${NBSP}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}${NBSP}h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `il y a ${days}${NBSP}j`;
  return d.toLocaleDateString("fr-CH");
}

export function formatCo2Kg(kg: number | null | undefined): string {
  if (kg == null) return "—";
  if (kg >= 1000) return `${nfCh.format(kg / 1000)}${NBSP}t CO₂`;
  return `${nfInt.format(kg)}${NBSP}kg CO₂`;
}
