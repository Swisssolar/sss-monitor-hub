import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import { prisma } from "@/lib/prisma";
import { createUser } from "@/lib/actions/admin";

export default async function NewUser() {
  const orgs = await prisma.organization.findMany({ orderBy: { name: "asc" } });

  return (
    <>
      <Link
        href="/admin/utilisateurs"
        className="eyebrow text-swiss-mute hover:text-swiss-ink"
      >
        ← Utilisateurs
      </Link>
      <h1 className="mt-3 font-display text-display-lg">Nouvel utilisateur</h1>

      <Card className="mt-8 p-6 md:p-8 max-w-xl">
        <form action={createUser} className="space-y-5">
          <Field label="Nom *" htmlFor="name">
            <Input id="name" name="name" required placeholder="Nom Prénom" />
          </Field>
          <Field label="E-mail *" htmlFor="email">
            <Input id="email" name="email" type="email" required />
          </Field>
          <Field
            label="Mot de passe *"
            htmlFor="password"
            hint="8 caractères minimum. À partager via un canal sécurisé."
          >
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
            />
          </Field>
          <Field label="Rôle *" htmlFor="role">
            <Select id="role" name="role" required defaultValue="CLIENT">
              <option value="CLIENT">Client (accès portail)</option>
              <option value="ADMIN">Administrateur (Swiss Solar System)</option>
            </Select>
          </Field>
          <Field
            label="Rattacher à une organisation"
            htmlFor="organizationId"
            hint="Uniquement pour les comptes Client."
          >
            <Select id="organizationId" name="organizationId">
              <option value="">— Aucune —</option>
              {orgs.map((o: (typeof orgs)[number]) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
          </Field>

          <div className="pt-2 flex items-center gap-3">
            <Button type="submit">Créer</Button>
            <Link
              href="/admin/utilisateurs"
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
