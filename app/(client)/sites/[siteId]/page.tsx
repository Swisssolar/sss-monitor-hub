import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { MetricsGrid } from "@/components/site/MetricsGrid";
import { ProductionChart } from "@/components/site/ProductionChart";
import { StatusPill } from "@/components/site/StatusPill";
import { ProviderBadge } from "@/components/site/ProviderBadge";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getSiteDetail } from "@/lib/services/sites";
import { formatKwc, formatRelative } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SiteDetailPage({
  params,
}: {
  params: { siteId: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const site = await getSiteDetail(
    params.siteId,
    session.userId,
    session.role === "ADMIN"
  );
  if (!site) notFound();

  const launchTarget =
    site.connections.find((c) => c.launchUrl)?.launchUrl ??
    site.externalPortalUrl;

  return (
    <>
      <Link
        href={session.role === "ADMIN" ? "/admin/sites" : "/dashboard"}
        className="eyebrow text-swiss-mute hover:text-swiss-ink inline-flex items-center gap-1.5"
      >
        <span aria-hidden>←</span> Retour
      </Link>

      <header className="mt-4 flex flex-col md:flex-row md:items-end md:justify-between gap-5">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <ProviderBadge code={site.providerPrimary} />
            <StatusPill status={site.connectionStatus} />
            {site.isDemo ? (
              <span className="eyebrow text-swiss-red">Données démo</span>
            ) : null}
          </div>
          <h1 className="mt-3 font-display text-display-lg tracking-tight">
            {site.name}
          </h1>
          <div className="mt-2 text-[14px] text-swiss-mute">
            {[site.address, site.postalCode, site.city]
              .filter(Boolean)
              .join(", ")}
            {site.kwcInstalled
              ? ` · Puissance installée ${formatKwc(site.kwcInstalled)}`
              : ""}
          </div>
          <div className="mt-1 text-[12px] text-swiss-mute">
            Client :{" "}
            <span className="text-swiss-ink">{site.organizationName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {launchTarget ? (
            <LinkButton variant="secondary" href={launchTarget} size="md">
              Portail officiel ↗
            </LinkButton>
          ) : null}
        </div>
      </header>

      <div className="mt-10">
        <MetricsGrid site={site} />
      </div>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <Card className="p-6">
          <div className="flex items-end justify-between mb-2">
            <div>
              <div className="eyebrow">Production — 24 dernières heures</div>
              <div className="mt-1 text-[13px] text-swiss-mute">
                Puissance instantanée · mise à jour{" "}
                {formatRelative(site.lastUpdateAt)}
              </div>
            </div>
          </div>
          <ProductionChart data={site.productionSeries} />
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="eyebrow">Connecteurs</div>
            {site.connections.length === 0 ? (
              <p className="mt-2 text-[13px] text-swiss-mute">
                Aucun connecteur configuré. Un administrateur peut en ajouter un
                depuis la console.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-swiss-line">
                {site.connections.map((c) => (
                  <li key={c.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-medium">
                          {c.displayName}
                        </div>
                        <div className="text-[11.5px] text-swiss-mute">
                          {c.lastSyncAt
                            ? `Dernière sync. ${formatRelative(c.lastSyncAt)}`
                            : "Jamais synchronisé"}
                        </div>
                      </div>
                      <StatusPill status={c.status} subtle />
                    </div>
                    {c.lastError ? (
                      <div className="mt-2 text-[11.5px] text-swiss-red">
                        {c.lastError}
                      </div>
                    ) : null}
                    {c.launchUrl ? (
                      <a
                        href={c.launchUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-[12px] text-swiss-mute hover:text-swiss-ink"
                      >
                        Ouvrir le portail officiel ↗
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <div className="eyebrow">Maintenance</div>
            <p className="mt-2 text-[13px] text-swiss-mute">
              Une anomalie ? L'équipe Swiss Solar System intervient sous 48h
              pour toute installation sous contrat.
            </p>
            <a
              href="mailto:contact@swisssolarsystem.com"
              className="mt-3 inline-block text-[13px] font-medium text-swiss-ink hover:text-swiss-red"
            >
              contact@swisssolarsystem.com →
            </a>
          </Card>
        </div>
      </div>
    </>
  );
}
