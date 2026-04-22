import type { ConnectionStatus } from "@prisma/client";

type Status = ConnectionStatus | "NONE";

const map: Record<
  Status,
  { label: string; dot: string; fg: string; bg: string }
> = {
  CONNECTED: {
    label: "Connecté",
    dot: "bg-emerald-600",
    fg: "text-emerald-800",
    bg: "bg-emerald-50",
  },
  DEMO: {
    label: "Démo",
    dot: "bg-swiss-red",
    fg: "text-swiss-ink",
    bg: "bg-swiss-line/60",
  },
  PENDING: {
    label: "En attente",
    dot: "bg-amber-500",
    fg: "text-amber-800",
    bg: "bg-amber-50",
  },
  ERROR: {
    label: "Reconnexion requise",
    dot: "bg-red-600",
    fg: "text-red-800",
    bg: "bg-red-50",
  },
  LINK_ONLY: {
    label: "Portail externe",
    dot: "bg-slate-500",
    fg: "text-slate-800",
    bg: "bg-slate-100",
  },
  NONE: {
    label: "Non configuré",
    dot: "bg-slate-400",
    fg: "text-slate-700",
    bg: "bg-slate-100",
  },
};

export function StatusPill({
  status,
  subtle = false,
}: {
  status: Status;
  subtle?: boolean;
}) {
  const m = map[status];
  if (subtle) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] text-swiss-mute">
        <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
        {m.label}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${m.bg} ${m.fg} px-2 py-0.5 text-[11px] font-medium rounded-sm`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}
