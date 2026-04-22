import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LogoMark } from "@/components/layout/LogoMark";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const session = await getSession();
  if (session) redirect(session.role === "ADMIN" ? "/admin" : "/dashboard");

  return (
    <div className="min-h-screen grid md:grid-cols-[1fr_minmax(420px,520px)]">
      {/* Editorial hero — large asymmetric type, quiet image area */}
      <div className="hidden md:flex relative bg-swiss-ink text-swiss-paper overflow-hidden">
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, #E30613 0, transparent 40%), radial-gradient(circle at 80% 70%, #E30613 0, transparent 45%)",
          }}
        />
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(255,255,255,0.4) 0 1px, transparent 1px 48px), repeating-linear-gradient(90deg, rgba(255,255,255,0.4) 0 1px, transparent 1px 48px)",
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <div className="text-[13px] tracking-tight">
              <span>Swiss Solar System</span>
              <span className="text-swiss-paper/60"> · Monitor Hub</span>
            </div>
          </div>

          <div className="stagger">
            <div style={{ ["--i" as string]: 0 }} className="eyebrow text-swiss-paper/60">
              Un seul portail
            </div>
            <h1
              style={{ ["--i" as string]: 1 }}
              className="font-display text-[clamp(2.75rem,5vw,4.25rem)] leading-[0.98] tracking-tight mt-3"
            >
              Tous vos bâtiments,
              <br />
              <em className="text-swiss-red not-italic font-display">
                une seule vue.
              </em>
            </h1>
            <p
              style={{ ["--i" as string]: 2 }}
              className="mt-6 text-swiss-paper/70 max-w-md text-[15px] leading-relaxed"
            >
              Plus besoin de jongler entre Enphase, Fronius, Victron ou Huawei.
              Le Monitor Hub centralise le suivi de toutes vos installations
              photovoltaïques — pour les régies, les propriétaires et les
              gestionnaires de patrimoine.
            </p>
          </div>

          <div className="text-[12px] text-swiss-paper/40">
            © {new Date().getFullYear()} Swiss Solar System Sàrl
          </div>
        </div>
      </div>

      {/* Right column — the form */}
      <div className="flex items-center justify-center p-6 md:p-12 bg-swiss-paper">
        <div className="w-full max-w-[380px]">
          <div className="md:hidden mb-10 flex items-center gap-2.5">
            <LogoMark />
            <div className="text-[13px] tracking-tight">
              <span className="font-medium">Swiss Solar System</span>
              <span className="text-swiss-mute"> · Monitor Hub</span>
            </div>
          </div>

          <h2 className="font-display text-[32px] leading-tight">
            Connexion
          </h2>
          <p className="mt-2 text-[14px] text-swiss-mute">
            Accédez à votre portail de supervision.
          </p>

          <form action="/api/auth/login" method="post" className="mt-8 space-y-5">
            <Field label="E-mail" htmlFor="email">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="vous@exemple.ch"
              />
            </Field>
            <Field label="Mot de passe" htmlFor="password">
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
              />
            </Field>

            {searchParams.error ? (
              <div className="text-[13px] text-swiss-red">
                Identifiants incorrects. Veuillez réessayer.
              </div>
            ) : null}

            <Button type="submit" size="lg" className="w-full">
              Entrer
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-swiss-line text-[12px] text-swiss-mute">
            Problème d'accès ?{" "}
            <Link href="mailto:contact@swisssolarsystem.com" className="text-swiss-ink underline underline-offset-2">
              contact@swisssolarsystem.com
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
