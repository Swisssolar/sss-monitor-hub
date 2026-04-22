import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { prisma } from "@/lib/prisma";
import { formatKwc } from "@/lib/format";
import { ProviderBadge } from "@/components/site/ProviderBadge";

export const dynamic = "force-dynamic";

export default async function SitesPage() {
  const sites = await prisma.site.findMany({
    orderBy: [{ organization: { name: "asc" } }, { name: "asc" }],
    include: {
      organization: true,
      _count: { select: { connections: true } },
    },
  });

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="eyebrow">Admin</div>
          <h1 className="mt-2 font-display text-display-lg">Bâtiments</h1>
          <p className="mt-2 text-[14px] text-swiss-mute">
            Tous les sites supervisés par Swiss Solar System.
          </p>
        </div>
        <LinkButton href="/admin/sites/new">Nouveau bâtiment</LinkButton>
      </div>

      <Card className="mt-8 overflow-x-auto">
        {sites.length === 0 ? (
          <div className="p-10 text-center text-[13px] text-swiss-mute">
            Pas encore de bâtiment. Créez-en un pour commencer.
          </div>
        ) : (
          <table className="w-full text-[14px] min-w-[800px]">
            <thead>
              <tr className="border-b border-swiss-line text-left">
                <th className="px-5 py-3 eyebrow font-normal">Bâtiment</th>
                <th className="px-5 py-3 eyebrow font-normal">Organisation</th>
                <th className="px-5 py-3 eyebrow font-normal">Fournisseur</th>
                <th className="px-5 py-3 eyebrow font-normal text-right">
                  Puissance
                </th>
                <th className="px-5 py-3 eyebrow font-normal text-right">
                  Connecteurs
                </th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {sites.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-swiss-line last:border-b-0 hover:bg-swiss-paper transition"
                >
                  <td className="px-5 py-3.5">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-[12px] text-swiss-mute">
                      {[s.address, s.city].filter(Boolean).join(" · ")}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-swiss-mute">
                    {s.organization.name}
                  </td>
                  <td className="px-5 py-3.5">
                    <ProviderBadge code={s.providerPrimary} />
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums">
                    {s.kwcInstalled ? formatKwc(s.kwcInstalled) : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums">
                    {s._count.connections}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/sites/${s.id}`}
                      className="text-[13px] text-swiss-ink hover:text-swiss-red"
                    >
                      Voir →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
