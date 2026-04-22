import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { createOrganization } from "@/lib/actions/admin";

export default function NewOrganisation() {
  return (
    <>
      <Link
        href="/admin/organisations"
        className="eyebrow text-swiss-mute hover:text-swiss-ink"
      >
        ← Organisations
      </Link>
      <h1 className="mt-3 font-display text-display-lg">
        Nouvelle organisation
      </h1>

      <Card className="mt-8 p-6 md:p-8 max-w-xl">
        <form action={createOrganization} className="space-y-5">
          <Field label="Nom *" htmlFor="name">
            <Input id="name" name="name" required placeholder="Régie Martin SA" />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Contact" htmlFor="contactName">
              <Input id="contactName" name="contactName" placeholder="Jean Dupont" />
            </Field>
            <Field label="E-mail contact" htmlFor="contactEmail">
              <Input
                id="contactEmail"
                name="contactEmail"
                type="email"
                placeholder="contact@regie.ch"
              />
            </Field>
          </div>

          <Field label="Téléphone" htmlFor="phone">
            <Input id="phone" name="phone" placeholder="+41 21 000 00 00" />
          </Field>

          <Field label="Notes" htmlFor="notes">
            <Textarea id="notes" name="notes" rows={3} />
          </Field>

          <div className="pt-2 flex items-center gap-3">
            <Button type="submit">Créer</Button>
            <Link
              href="/admin/organisations"
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
