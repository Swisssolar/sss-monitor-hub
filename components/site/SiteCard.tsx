import Link from "next/link";
import type { SiteCardView } from "@/lib/services/sites";
import { Card } from "@/components/ui/Card";
import { StatusPill } from "@/components/site/StatusPill";
import { ProviderBadge } from "@/components/site/ProviderBadge";
import {
  formatEnergyWh,
  formatKwc,
  formatPercent,
  formatPowerW,
  formatRelative,
} from "@/lib/format";

function MicroMetric({
  label,
  value,
  live = false,
}: {
  label: string;
  value: string;
  live?: boolean;
}) {
  return (
    <div>
      <div className="eyebrow flex items-center gap-1.5">
        {live ? <span className="live-dot" aria-hidden /> : null}
        {label}
      </div>
      <div className="mt-1 metric-figure text-[28px]">{value}</div>
    </div>
  );
}

export function SiteCard({ site }: { site: SiteCardView }) {
  const isLive = site.currentPowerW != null && site.currentPowerW > 50;
  const linkOnly = site.connectionStatus === "LINK_ONLY";

  return (
    <Card className="p-6 flex flex-col h-full" as="article">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <ProviderBadge code={site.providerPrimary} />
            {site.isDemo ? (
              <span className="eyebrow text-swiss-red">Démo</span>
            ) : null}
          </div>
          <h3 className="mt-2 font-display text-[24px] leading-tight tracking-tight truncate">
            {site.name}
          </h3>
          <div className="mt-1 text-[13px] text-swiss-mute truncate">
            {[site.address, site.city].filter(Boolean).join(" · ") ||
              "Adresse à renseigner"}
          </div>
        </div>
        <StatusPill status={site.connectionStatus} />
      </div>

      <hr className="hairline my-5" />

      {linkOnly ? (
        <div className="py-4 flex-1">
          <div className="eyebrow">Monitoring</div>
          <p className="mt-1 text-[14px] text-swiss-ink">
            Ce site est supervisé via le portail officiel du fabricant.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <MicroMetric
            label="Production"
            value={formatPowerW(site.currentPowerW)}
            live={isLive}
          />
          <MicroMetric
            label="Aujourd'hui"
            value={formatEnergyWh(site.dailyEnergyWh)}
          />
          <MicroMetric
            label="Batterie"
            value={formatPercent(site.batterySoc)}
          />
        </div>
      )}

      <div className="mt-auto pt-5 border-t border-swiss-line flex items-center justify-between gap-3">
        <div className="text-[11.5px] text-swiss-mute tabular-nums">
          {site.kwcInstalled ? formatKwc(site.kwcInstalled) + " · " : ""}
          MAJ {formatRelative(site.lastUpdateAt)}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {site.externalPortalUrl ? (
            <a
              href={site.externalPortalUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[12.5px] text-swiss-mute hover:text-swiss-ink transition"
            >
              Portail ↗
            </a>
          ) : null}
          <Link
            href={`/sites/${site.id}`}
            className="text-[13px] font-medium text-swiss-ink hover:text-swiss-red transition inline-flex items-center gap-1"
          >
            Détail <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </Card>
  );
}
