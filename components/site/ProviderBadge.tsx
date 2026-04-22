import type { ProviderCode } from "@prisma/client";

const labels: Record<ProviderCode, string> = {
  ENPHASE: "Enphase",
  FRONIUS: "Fronius",
  VICTRON: "Victron",
  HUAWEI: "Huawei",
  SOLAX: "SolaX",
  GENERIC_LINK: "Portail externe",
};

export function ProviderBadge({ code }: { code: ProviderCode | null }) {
  if (!code) {
    return (
      <span className="eyebrow text-swiss-mute/70">Aucun connecteur</span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 eyebrow">
      <span className="w-1 h-1 rounded-full bg-swiss-ink" />
      {labels[code]}
    </span>
  );
}
