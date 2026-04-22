import Link from "next/link";
import type { ReactNode } from "react";
import type { SessionPayload } from "@/lib/auth";
import { LogoMark } from "@/components/layout/LogoMark";

interface NavItem {
  href: string;
  label: string;
}

function navFor(role: "ADMIN" | "CLIENT"): NavItem[] {
  if (role === "ADMIN") {
    return [
      { href: "/admin", label: "Tableau de bord" },
      { href: "/admin/sites", label: "Bâtiments" },
      { href: "/admin/connexions", label: "Connexions" },
      { href: "/admin/organisations", label: "Organisations" },
      { href: "/admin/utilisateurs", label: "Utilisateurs" },
    ];
  }
  return [
    { href: "/dashboard", label: "Tableau de bord" },
    { href: "/parametres", label: "Paramètres" },
  ];
}

export function AppShell({
  session,
  children,
  currentPath = "",
}: {
  session: SessionPayload;
  children: ReactNode;
  currentPath?: string;
}) {
  const items = navFor(session.role);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar — sticky on mobile, static on desktop; always hairline below. */}
      <header className="sticky top-0 z-20 bg-swiss-paper/90 backdrop-blur border-b border-swiss-line">
        <div className="max-w-[1240px] mx-auto px-5 md:px-8 h-14 md:h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <LogoMark />
            <span className="hidden sm:inline text-[13px] tracking-tight">
              <span className="font-medium">Swiss Solar System</span>
              <span className="text-swiss-mute"> · Monitor Hub</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {items.map((i) => {
              const active =
                currentPath === i.href ||
                (i.href !== "/admin" && currentPath.startsWith(i.href));
              return (
                <Link
                  key={i.href}
                  href={i.href}
                  className={
                    "text-[13.5px] transition " +
                    (active
                      ? "text-swiss-ink"
                      : "text-swiss-mute hover:text-swiss-ink")
                  }
                >
                  {i.label}
                </Link>
              );
            })}
          </nav>

          <form
            action="/api/auth/logout"
            method="post"
            className="flex items-center gap-3"
          >
            <span className="hidden sm:inline text-[13px] text-swiss-mute">
              {session.name}
            </span>
            <button
              type="submit"
              className="text-[12.5px] text-swiss-mute hover:text-swiss-ink transition"
            >
              Déconnexion
            </button>
          </form>
        </div>

        {/* Mobile nav strip */}
        <div className="md:hidden border-t border-swiss-line overflow-x-auto">
          <div className="flex px-3 gap-1 min-w-max">
            {items.map((i) => {
              const active =
                currentPath === i.href ||
                (i.href !== "/admin" && currentPath.startsWith(i.href));
              return (
                <Link
                  key={i.href}
                  href={i.href}
                  className={
                    "text-[12px] px-3 py-2.5 whitespace-nowrap transition " +
                    (active
                      ? "text-swiss-ink border-b-2 border-swiss-red -mb-[1px]"
                      : "text-swiss-mute")
                  }
                >
                  {i.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-[1240px] mx-auto px-5 md:px-8 py-6 md:py-10">
          {children}
        </div>
      </main>

      <footer className="border-t border-swiss-line">
        <div className="max-w-[1240px] mx-auto px-5 md:px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[12px] text-swiss-mute">
          <div>
            Swiss Solar System Sàrl · Chavannes-près-Renens ·{" "}
            <a className="hover:text-swiss-ink" href="tel:+41215520440">
              +41 21 552 04 40
            </a>
          </div>
          <div>
            <a
              className="hover:text-swiss-ink"
              href="https://www.swisssolarsystem.com"
              target="_blank"
              rel="noreferrer"
            >
              swisssolarsystem.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
