import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();
  const pathname = headers().get("x-pathname") ?? "";
  return (
    <AppShell session={session} currentPath={pathname}>
      {children}
    </AppShell>
  );
}
