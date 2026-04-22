import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { prisma } from "@/lib/prisma";
import { createConnection } from "@/lib/actions/admin";
import { providerCatalog } from "@/lib/providers/registry";

export default async function NewConnection() {
  const [sites, providerTypes] = await Promise.all([
    prisma.site.findMany({
      orderBy: { name: "asc" },
      include: { organization: true },
    }),
    prisma.providerType.findMany({
      where: { isActive: true },
      orderBy: { displayName: "asc" },
    }),
  ]);

  return (
    <>
      <Link
        href="/admin/connexions"
        className="eyebrow text-swiss-mute hover:text-swiss-ink"
      >
        ← Connexions
      </Link>
      <h1 className="mt-3 font-display text-display-lg">Nouvelle connexion</h1>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        <Card className="p-6 md:p-8">
          <form action={createConnection} className="space-y-5">
            <Field label="Bâtiment *" htmlFor="siteId">
              <Select id="siteId" name="siteId" required>
                <option value="">— Choisir —</option>
                {sites.map((s: (typeof sites)[number]) => (
                  <option key={s.id} value={s.id}>
                    {s.organization.name} — {s.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Fournisseur *" htmlFor="providerTypeId">
              <Select id="providerTypeId" name="providerTypeId" required>
                <option value="">— Choisir —</option>
                {providerTypes.map((p: (typeof providerTypes)[number]) => (
                  <option key={p.id} value={p.id}>
                    {p.displayName} · {p.authMode}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="URL / endpoint"
                htmlFor="apiBaseUrl"
                hint="Fronius: URL locale. Portail externe: lien vers le portail client."
              >
                <Input
                  id="apiBaseUrl"
                  name="apiBaseUrl"
                  placeholder="https://..."
                />
              </Field>
              <Field
                label="Identifiant fournisseur"
                htmlFor="externalAccountIdentifier"
                hint="Enphase system_id, Victron idSite, etc."
              >
                <Input
                  id="externalAccountIdentifier"
                  name="externalAccountIdentifier"
                />
              </Field>
            </div>

            <Field
              label="Secret / token API"
              htmlFor="apiSecret"
              hint="Stocké chiffré (AES-256-GCM). Pour Enphase, utiliser le flux OAuth depuis la liste."
            >
              <Input
                id="apiSecret"
                name="apiSecret"
                type="password"
                autoComplete="off"
              />
            </Field>

            <Field
              label="Métadonnées JSON"
              htmlFor="metadata"
              hint='Optionnel. Ex: { "solarWebUrl": "https://www.solarweb.com/..." }'
            >
              <Textarea id="metadata" name="metadata" rows={3} />
            </Field>

            <label className="flex items-center gap-3 text-[14px]">
              <input
                type="checkbox"
                name="demoMode"
                className="accent-swiss-red h-4 w-4"
              />
              <span>
                Activer le mode démo (génère des métriques réalistes)
              </span>
            </label>

            <div className="pt-2 flex items-center gap-3">
              <Button type="submit">Créer la connexion</Button>
              <Link
                href="/admin/connexions"
                className="text-[13.5px] text-swiss-mute hover:text-swiss-ink"
              >
                Annuler
              </Link>
            </div>
          </form>
        </Card>

        <Card className="p-5">
          <div className="eyebrow">Guide fournisseurs</div>
          <ul className="mt-3 divide-y divide-swiss-line">
            {providerCatalog.map((p) => (
              <li key={p.code} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[13.5px] font-medium">
                    {p.displayName}
                  </div>
                  <span
                    className={
                      "text-[10.5px] px-1.5 py-0.5 rounded-sm " +
                      (p.hasDirectSync
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-slate-100 text-slate-700")
                    }
                  >
                    {p.hasDirectSync ? "API direct" : "Lien externe"}
                  </span>
                </div>
                <p className="mt-1 text-[12px] text-swiss-mute">
                  {p.setupHint}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
