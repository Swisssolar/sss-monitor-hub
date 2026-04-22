import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { prisma } from "@/lib/prisma";
import { formatRelative } from "@/lib/format";
import { StatusPill } from "@/components/site/StatusPill";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [orgCount, siteCount, userCount, connections, recentLogs] =
    await Promise.all([
      prisma.organization.count(),
      prisma.site.count(),
      prisma.user.count(),
      prisma.providerConnection.findMany({
        include: { site: true, providerType: true },
        orderBy: { updatedAt: "desc" },
        take: 6,
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { actor: true },
      }),
    ]);

  const errorCount = connections.filter((c: (typeof connections)[number]) => c.status === "ERROR").length;

  return (
    <>
      <div className="eyebrow">Console d'administration</div>
      <h1 className="mt-2 font-display text-display-lg">Vue d'ensemble</h1>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-px bg-swiss-line border border-swiss-line rounded-sm overflow-hidden">
        <Kpi
          label="Organisations"
          value={orgCount}
          href="/admin/organisations"
        />
        <Kpi label="Bâtiments" value={siteCount} href="/admin/sites" />
        <Kpi label="Utilisateurs" value={userCount} href="/admin/utilisateurs" />
        <Kpi
          label="Connexions en erreur"
          value={errorCount}
          href="/admin/connexions"
          accent={errorCount > 0}
        />
      </div>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-5">
        <Card className="p-6">
          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="eyebrow">Dernières connexions fournisseurs</div>
            </div>
            <Link
              href="/admin/connexions"
              className="text-[12.5px] text-swiss-mute hover:text-swiss-ink"
            >
              Tout voir →
            </Link>
          </div>
          {connections.length === 0 ? (
            <div className="text-[13px] text-swiss-mute py-6">
              Aucune connexion configurée. Commencez par créer un bâtiment.
            </div>
          ) : (
            <ul className="divide-y divide-swiss-line">
              {connections.map((c: (typeof connections)[number]) => (
                <li
                  key={c.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-[14px] truncate">
                      {c.site.name}{" "}
                      <span className="text-swiss-mute">·</span>{" "}
                      <span className="text-swiss-mute">
                        {c.providerType.displayName}
                      </span>
                    </div>
                    <div className="text-[11.5px] text-swiss-mute">
                      {c.lastSyncAt
                        ? `Dernière sync. ${formatRelative(c.lastSyncAt)}`
                        : "Jamais synchronisé"}
                    </div>
                  </div>
                  <StatusPill status={c.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <div className="eyebrow">Journal d'audit</div>
          <ul className="mt-4 divide-y divide-swiss-line">
            {recentLogs.length === 0 ? (
              <li className="py-2 text-[13px] text-swiss-mute">
                Aucun événement.
              </li>
            ) : (
              recentLogs.map((l: (typeof recentLogs)[number]) => (
                <li key={l.id} className="py-2.5 text-[12.5px]">
                  <div className="flex items-center justify-between gap-2">
                    <code className="font-mono text-[11.5px] text-swiss-ink bg-swiss-line/40 px-1.5 py-0.5 rounded-sm truncate">
                      {l.action}
                    </code>
                    <span className="text-swiss-mute shrink-0">
                      {formatRelative(l.createdAt)}
                    </span>
                  </div>
                  {l.actor ? (
                    <div className="text-[11px] text-swiss-mute mt-0.5 truncate">
                      {l.actor.email} · {l.entityType}
                    </div>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>
    </>
  );
}

function Kpi({
  label,
  value,
  href,
  accent = false,
}: {
  label: string;
  value: number;
  href: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className="bg-swiss-paper px-5 py-5 block hover:bg-white transition"
    >
      <div className="eyebrow">{label}</div>
      <div
        className={
          "mt-1.5 metric-figure text-[36px] " +
          (accent ? "text-swiss-red" : "")
        }
      >
        {value}
      </div>
    </Link>
  );
}
