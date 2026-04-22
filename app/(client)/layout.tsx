import { headers } from "next/headers";
import { requireSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const pathname = headers().get("x-pathname") ?? "";
  return (
    <AppShell session={session} currentPath={pathname}>
      {children}
    </AppShell>
  );
}
