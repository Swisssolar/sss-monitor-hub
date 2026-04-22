import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { prisma } from "@/lib/prisma";
import { createSite } from "@/lib/actions/admin";

export default async function NewSite() {
  const orgs = await prisma.organization.findMany({ orderBy: { name: "asc" } });

  return (
    <>
      <Link
        href="/admin/sites"
        className="eyebrow text-swiss-mute hover:text-swiss-ink"
      >
        ← Bâtiments
      </Link>
      <h1 className="mt-3 font-display text-display-lg">Nouveau bâtiment</h1>

      <Card className="mt-8 p-6 md:p-8 max-w-2xl">
        <form action={createSite} className="space-y-5">
          <Field label="Organisation *" htmlFor="organizationId">
            <Select id="organizationId" name="organizationId" required>
              <option value="">— Choisir —</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Nom du bâtiment *" htmlFor="name">
            <Input id="name" name="name" required placeholder="Villa Meier" />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Adresse" htmlFor="address">
              <Input id="address" name="address" />
            </Field>
            <Field label="Localité" htmlFor="city">
              <Input id="city" name="city" />
            </Field>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="NPA" htmlFor="postalCode">
              <Input id="postalCode" name="postalCode" />
            </Field>
            <Field label="Pays" htmlFor="country">
              <Input id="country" name="country" defaultValue="CH" />
            </Field>
            <Field label="kWc" htmlFor="kwcInstalled">
              <Input
                id="kwcInstalled"
                name="kwcInstalled"
                type="number"
                step="0.1"
                placeholder="10"
              />
            </Field>
            <Field label="kWh batterie" htmlFor="batteryKwh">
              <Input
                id="batteryKwh"
                name="batteryKwh"
                type="number"
                step="0.1"
                placeholder="10"
              />
            </Field>
          </div>

          <Field
            label="Fournisseur principal"
            htmlFor="providerPrimary"
            hint="Utilisé pour le badge affiché sur la carte du site."
          >
            <Select id="providerPrimary" name="providerPrimary">
              <option value="">— Aucun —</option>
              <option value="SOLAX">SolaX</option>
              <option value="FRONIUS">Fronius</option>
              <option value="VICTRON">Victron</option>
              <option value="ENPHASE">Enphase</option>
              <option value="HUAWEI">Huawei</option>
              <option value="GENERIC_LINK">Portail externe</option>
            </Select>
          </Field>

          <Field
            label="URL du portail officiel"
            htmlFor="externalPortalUrl"
            hint="Fallback affiché au client si aucune intégration directe n'est active."
          >
            <Input
              id="externalPortalUrl"
              name="externalPortalUrl"
              type="url"
              placeholder="https://www.solaxcloud.com/..."
            />
          </Field>

          <Field label="Notes internes" htmlFor="notes">
            <Textarea id="notes" name="notes" rows={3} />
          </Field>

          <div className="pt-2 flex items-center gap-3">
            <Button type="submit">Créer</Button>
            <Link
              href="/admin/sites"
              className="text-[13.5px] text-swiss-mute hover:text-swiss-ink"
            >
              Annuler
            </Link>
          </div>
        </form>
      </Card>
    </>
  );
}
