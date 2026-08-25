import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import PortalShell from "@/components/shared/PortalShell";
import type { PortalNavItem } from "@/components/shared/PortalSidebar";

const navItems: PortalNavItem[] = [{ href: "/reception", label: "Lidlar", icon: "users" }];

export default async function ReceptionLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const isAdminRole = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
  if (session.user.role !== "RECEPTION" && !isAdminRole) redirect("/dashboard");

  return (
    <PortalShell navItems={navItems} portalLabel="Reception" profileHref="/profile">
      {children}
    </PortalShell>
  );
}
