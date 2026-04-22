import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function OrganisationsPage() {
  const orgs = await prisma.organization.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { sites: true, memberships: true } },
    },
  });

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="eyebrow">Admin</div>
          <h1 className="mt-2 font-display text-display-lg">Organisations</h1>
          <p className="mt-2 text-[14px] text-swiss-mute">
            Une organisation regroupe les bâtiments d'un client ou d'une régie.
          </p>
        </div>
        <LinkButton href="/admin/organisations/new">
          Nouvelle organisation
        </LinkButton>
      </div>

      <Card className="mt-8 overflow-x-auto">
        {orgs.length === 0 ? (
          <div className="p-10 text-center text-[13px] text-swiss-mute">
            Aucune organisation pour l'instant.
          </div>
        ) : (
          <table className="w-full text-[14px] min-w-[640px]">
            <thead>
              <tr className="border-b border-swiss-line text-left">
                <th className="px-5 py-3 eyebrow font-normal">Nom</th>
                <th className="px-5 py-3 eyebrow font-normal">Contact</th>
                <th className="px-5 py-3 eyebrow font-normal text-right">
                  Bâtiments
                </th>
                <th className="px-5 py-3 eyebrow font-normal text-right">
                  Membres
                </th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((o: (typeof orgs)[number]) => (
                <tr
                  key={o.id}
                  className="border-b border-swiss-line last:border-b-0 hover:bg-swiss-paper transition"
                >
                  <td className="px-5 py-3.5">
                    <div className="font-medium">{o.name}</div>
                    {o.contactName ? (
                      <div className="text-[12px] text-swiss-mute">
                        {o.contactName}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-swiss-mute">
                    {o.contactEmail || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums">
                    {o._count.sites}
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums">
                    {o._count.memberships}
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
