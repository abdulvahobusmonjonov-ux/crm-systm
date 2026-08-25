import { useState } from "react";
import PortalSidebar from "@/components/shared/PortalSidebar";
import PortalTopbar from "@/components/shared/PortalTopbar";
export default function PortalShell({ navItems, portalLabel, profileHref, children }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    return (<div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <PortalSidebar navItems={navItems} portalLabel={portalLabel} profileHref={profileHref} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)}/>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <PortalTopbar portalLabel={portalLabel} profileHref={profileHref} onMenuClick={() => setMobileOpen(true)}/>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>);
}
