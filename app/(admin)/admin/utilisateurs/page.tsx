import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { prisma } from "@/lib/prisma";
import { formatRelative } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      memberships: { include: { organization: true } },
    },
  });

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="eyebrow">Admin</div>
          <h1 className="mt-2 font-display text-display-lg">Utilisateurs</h1>
        </div>
        <LinkButton href="/admin/utilisateurs/new">
          Nouvel utilisateur
        </LinkButton>
      </div>

      <Card className="mt-8 overflow-x-auto">
        {users.length === 0 ? (
          <div className="p-10 text-center text-[13px] text-swiss-mute">
            Aucun utilisateur.
          </div>
        ) : (
          <table className="w-full text-[14px] min-w-[800px]">
            <thead>
              <tr className="border-b border-swiss-line text-left">
                <th className="px-5 py-3 eyebrow font-normal">Nom</th>
                <th className="px-5 py-3 eyebrow font-normal">E-mail</th>
                <th className="px-5 py-3 eyebrow font-normal">Rôle</th>
                <th className="px-5 py-3 eyebrow font-normal">Organisations</th>
                <th className="px-5 py-3 eyebrow font-normal">
                  Dernière connexion
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: (typeof users)[number]) => (
                <tr
                  key={u.id}
                  className="border-b border-swiss-line last:border-b-0 hover:bg-swiss-paper transition"
                >
                  <td className="px-5 py-3.5 font-medium">{u.name}</td>
                  <td className="px-5 py-3.5 text-[13px] text-swiss-mute">
                    {u.email}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={
                        "text-[11px] px-1.5 py-0.5 rounded-sm " +
                        (u.role === "ADMIN"
                          ? "bg-swiss-ink text-swiss-paper"
                          : "bg-swiss-line/60 text-swiss-ink")
                      }
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-swiss-mute">
                    {u.memberships.map((m: (typeof u.memberships)[number]) => m.organization.name).join(", ") ||
                      "—"}
                  </td>
                  <td className="px-5 py-3.5 text-[12.5px] text-swiss-mute">
                    {formatRelative(u.lastLoginAt)}
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
