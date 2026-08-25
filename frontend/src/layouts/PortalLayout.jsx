// src/app/finance/layout.tsx va src/app/reception/layout.tsx o'rnida — ikkalasi
// ham bir xil PortalShell'ni faqat boshqa nav/rol bilan ishlatgan.
import { Outlet } from "react-router-dom";
import PortalShell from "@/components/shared/PortalShell";
import { RequireRole } from "@/routes/guards";
import { isAdmin } from "@/lib/permissions";

const FINANCE_NAV = [{ href: "/finance", label: "Moliya", icon: "wallet" }];
const RECEPTION_NAV = [{ href: "/reception", label: "Lidlar", icon: "users" }];

function PortalLayout({ navItems, portalLabel, role }) {
  return (
    <RequireRole check={(user) => user.role === role || isAdmin(user)}>
      <PortalShell navItems={navItems} portalLabel={portalLabel} profileHref="/profile">
        <Outlet />
      </PortalShell>
    </RequireRole>
  );
}

export function FinanceLayout() {
  return <PortalLayout navItems={FINANCE_NAV} portalLabel="Buxgalter" role="ACCOUNTANT" />;
}

export function ReceptionLayout() {
  return <PortalLayout navItems={RECEPTION_NAV} portalLabel="Reception" role="RECEPTION" />;
}
