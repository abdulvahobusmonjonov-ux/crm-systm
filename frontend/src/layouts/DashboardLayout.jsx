// src/app/(dashboard)/layout.tsx o'rnida.
import { Outlet } from "react-router-dom";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { RequireAuth } from "@/routes/guards";

export default function DashboardLayout() {
  return (
    <RequireAuth>
      <DashboardShell>
        <Outlet />
      </DashboardShell>
    </RequireAuth>
  );
}
