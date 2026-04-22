import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ParametresPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const memberships = await prisma.membership.findMany({
    where: { userId: session.userId },
    include: { organization: true },
  });

  return (
    <>
      <div className="eyebrow">Votre compte</div>
      <h1 className="mt-2 font-display text-display-lg">Paramètres</h1>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-6">
          <div className="eyebrow">Profil</div>
          <dl className="mt-4 text-[14px] space-y-3">
            <Row label="Nom" value={session.name} />
            <Row label="E-mail" value={session.email} />
            <Row
              label="Rôle"
              value={session.role === "ADMIN" ? "Administrateur" : "Client"}
            />
          </dl>
          <p className="mt-6 text-[12px] text-swiss-mute">
            Pour modifier vos informations, contactez votre interlocuteur chez
            Swiss Solar System.
          </p>
        </Card>

        <Card className="p-6">
          <div className="eyebrow">Organisations</div>
          <ul className="mt-4 divide-y divide-swiss-line">
            {memberships.length === 0 ? (
              <li className="py-2 text-[13px] text-swiss-mute">
                Aucune organisation rattachée.
              </li>
            ) : (
              memberships.map((m) => (
                <li
                  key={m.id}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between"
                >
                  <div>
                    <div className="text-[14px]">{m.organization.name}</div>
                    <div className="text-[11.5px] text-swiss-mute">
                      {m.organization.contactEmail ?? ""}
                    </div>
                  </div>
                  <span className="eyebrow">
                    {m.roleWithinOrganization}
                  </span>
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card className="p-6 md:col-span-2">
          <div className="eyebrow">Support</div>
          <p className="mt-3 text-[14px] text-swiss-mute max-w-2xl">
            Une question sur une installation, un rapport, ou un accès ? Notre
            équipe répond sous 48h ouvrées.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-[13.5px]">
            <a
              href="mailto:contact@swisssolarsystem.com"
              className="text-swiss-ink underline underline-offset-2 hover:text-swiss-red"
            >
              contact@swisssolarsystem.com
            </a>
            <span className="text-swiss-mute">·</span>
            <a
              href="tel:+41215520440"
              className="text-swiss-ink underline underline-offset-2 hover:text-swiss-red"
            >
              +41 21 552 04 40
            </a>
          </div>
        </Card>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-swiss-mute">{label}</dt>
      <dd className="text-swiss-ink text-right">{value}</dd>
    </div>
  );
}
