import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { StatusPill } from "@/components/site/StatusPill";
import { prisma } from "@/lib/prisma";
import { formatRelative } from "@/lib/format";
import {
  toggleDemoMode,
  syncConnectionNow,
  startEnphaseOAuth,
} from "@/lib/actions/admin";
import { enphaseIsConfigured } from "@/lib/providers/enphase";

export const dynamic = "force-dynamic";

export default async function ConnexionsPage({
  searchParams,
}: {
  searchParams: { error?: string; ok?: string };
}) {
  const connections = await prisma.providerConnection.findMany({
    include: {
      site: { include: { organization: true } },
      providerType: true,
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });

  const enphaseReady = enphaseIsConfigured();

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="eyebrow">Admin</div>
          <h1 className="mt-2 font-display text-display-lg">
            Connexions fournisseurs
          </h1>
          <p className="mt-2 text-[14px] text-swiss-mute max-w-2xl">
            Chaque bâtiment peut porter plusieurs connexions (API direct ou lien
            externe). Activez le mode démo pour présenter le portail sans
            attendre les identifiants fournisseur.
          </p>
        </div>
        <LinkButton href="/admin/connexions/new">Nouvelle connexion</LinkButton>
      </div>

      {searchParams.error ? (
        <div className="mt-6 px-4 py-3 bg-red-50 border border-red-200 text-[13px] text-red-900 rounded-sm">
          {decodeURIComponent(searchParams.error)}
        </div>
      ) : null}
      {searchParams.ok ? (
        <div className="mt-6 px-4 py-3 bg-emerald-50 border border-emerald-200 text-[13px] text-emerald-900 rounded-sm">
          Opération réussie.
        </div>
      ) : null}

      <Card className="mt-8 overflow-x-auto">
        {connections.length === 0 ? (
          <div className="p-10 text-center text-[13px] text-swiss-mute">
            Aucune connexion fournisseur configurée.
          </div>
        ) : (
          <table className="w-full text-[13.5px] min-w-[900px]">
            <thead>
              <tr className="border-b border-swiss-line text-left">
                <th className="px-4 py-3 eyebrow font-normal">Bâtiment</th>
                <th className="px-4 py-3 eyebrow font-normal">Fournisseur</th>
                <th className="px-4 py-3 eyebrow font-normal">Statut</th>
                <th className="px-4 py-3 eyebrow font-normal">Dernière sync.</th>
                <th className="px-4 py-3 eyebrow font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {connections.map((c) => {
                const isEnphase = c.providerType.code === "ENPHASE";
                const needsOAuth =
                  isEnphase && !c.demoMode && !c.accessTokenEncrypted;

                return (
                  <tr
                    key={c.id}
                    className="border-b border-swiss-line last:border-b-0 hover:bg-swiss-paper transition align-top"
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-medium">{c.site.name}</div>
                      <div className="text-[12px] text-swiss-mute">
                        {c.site.organization.name}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div>{c.providerType.displayName}</div>
                      <div className="text-[11.5px] text-swiss-mute">
                        {c.providerType.authMode}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-1">
                        <StatusPill status={c.status} />
                        {c.lastError ? (
                          <span className="text-[11px] text-swiss-red max-w-[240px] line-clamp-2">
                            {c.lastError}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-swiss-mute">
                      {formatRelative(c.lastSyncAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {needsOAuth ? (
                          <form action={startEnphaseOAuth}>
                            <input
                              type="hidden"
                              name="connectionId"
                              value={c.id}
                            />
                            <Button
                              variant="primary"
                              size="sm"
                              type="submit"
                              disabled={!enphaseReady}
                              title={
                                enphaseReady
                                  ? ""
                                  : "ENPHASE_CLIENT_ID / API_KEY manquants dans .env"
                              }
                            >
                              Connecter Enphase
                            </Button>
                          </form>
                        ) : (
                          <form action={syncConnectionNow}>
                            <input
                              type="hidden"
                              name="connectionId"
                              value={c.id}
                            />
                            <Button
                              variant="secondary"
                              size="sm"
                              type="submit"
                            >
                              Synchroniser
                            </Button>
                          </form>
                        )}

                        <form action={toggleDemoMode}>
                          <input
                            type="hidden"
                            name="connectionId"
                            value={c.id}
                          />
                          <Button
                            variant={c.demoMode ? "danger" : "ghost"}
                            size="sm"
                            type="submit"
                          >
                            {c.demoMode ? "Démo ON" : "Activer démo"}
                          </Button>
                        </form>

                        <Link
                          href={`/sites/${c.siteId}`}
                          className="text-[12.5px] text-swiss-mute hover:text-swiss-ink"
                        >
                          Voir
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
