// src/app/student/layout.tsx o'rnida: faqat o'quvchi hisobi.
import { Outlet } from "react-router-dom";
import StudentShell from "@/components/student/StudentShell";
import { RequireRole } from "@/routes/guards";

export default function StudentLayout() {
  return (
    <RequireRole check={(user) => user.accountType === "student"}>
      <StudentShell>
        <Outlet />
      </StudentShell>
    </RequireRole>
  );
}
