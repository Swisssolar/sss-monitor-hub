import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SiteCard } from "@/components/site/SiteCard";
import { listSitesForUser } from "@/lib/services/sites";
import { prisma } from "@/lib/prisma";
import {
  formatEnergyWh,
  formatKwc,
  formatPowerW,
} from "@/lib/format";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

function greetingFor(name: string): string {
  const h = new Date().getHours();
  const g = h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir";
  const first = (name || "").split(" ")[0] || "bienvenue";
  return `${g}, ${first}`;
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const sites = await listSitesForUser(session.userId);

  const firstMembership = await prisma.membership.findFirst({
    where: { userId: session.userId },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });
  const orgName = firstMembership?.organization.name ?? "";

  const totalKwc = sites.reduce((s, x) => s + (x.kwcInstalled ?? 0), 0);
  const totalNowW = sites.reduce((s, x) => s + (x.currentPowerW ?? 0), 0);
  const totalTodayWh = sites.reduce((s, x) => s + (x.dailyEnergyWh ?? 0), 0);
  const liveCount = sites.filter(
    (s) =>
      s.connectionStatus === "CONNECTED" || s.connectionStatus === "DEMO"
  ).length;

  return (
    <>
      <section className="stagger">
        <div className="eyebrow" style={{ ["--i" as string]: 0 }}>
          {orgName || "Portail client"}
        </div>
        <h1
          className="mt-2 font-display text-display-xl"
          style={{ ["--i" as string]: 1 }}
        >
          {greetingFor(session.name)}.
        </h1>
        <p
          className="mt-3 text-[15px] text-swiss-mute max-w-xl"
          style={{ ["--i" as string]: 2 }}
        >
          Vue consolidée de toutes vos installations photovoltaïques. Un seul
          portail, tous vos fabricants.
        </p>
      </section>

      <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-px bg-swiss-line border border-swiss-line rounded-sm overflow-hidden">
        <Kpi label="Bâtiments" value={sites.length.toString()} />
        <Kpi
          label="Puissance installée"
          value={totalKwc > 0 ? formatKwc(totalKwc) : "—"}
        />
        <Kpi
          label="Production instantanée"
          value={formatPowerW(totalNowW)}
          live={totalNowW > 100}
        />
        <Kpi label="Énergie du jour" value={formatEnergyWh(totalTodayWh)} />
      </div>

      <section className="mt-12">
        <div className="flex items-end justify-between mb-6 gap-4">
          <h2 className="font-display text-[28px] tracking-tight">
            Vos bâtiments
          </h2>
          <div className="text-[12px] text-swiss-mute">
            {liveCount}/{sites.length} en ligne
          </div>
        </div>

        {sites.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
            {sites.map((s, i) => (
              <div key={s.id} style={{ ["--i" as string]: i }}>
                <SiteCard site={s} />
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function Kpi({
  label,
  value,
  live = false,
}: {
  label: string;
  value: string;
  live?: boolean;
}) {
  return (
    <div className="bg-swiss-paper px-5 py-5">
      <div className="eyebrow flex items-center gap-1.5">
        {live ? <span className="live-dot" aria-hidden /> : null}
        {label}
      </div>
      <div className="mt-1.5 metric-figure text-[32px] md:text-[36px]">
        {value}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="p-10 text-center">
      <div className="eyebrow">Aucun bâtiment</div>
      <h3 className="mt-2 font-display text-[24px]">
        Votre portail est prêt à accueillir vos installations.
      </h3>
      <p className="mt-2 text-[14px] text-swiss-mute max-w-md mx-auto">
        L'équipe Swiss Solar System va bientôt rattacher vos sites à votre
        organisation. Besoin d'aide : contact@swisssolarsystem.com
      </p>
    </Card>
  );
}
