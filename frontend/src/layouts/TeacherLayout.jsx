// src/app/teacher/layout.tsx o'rnida: o'qituvchi, mentor yoki admin kira oladi.
import { Outlet } from "react-router-dom";
import TeacherShell from "@/components/teacher/TeacherShell";
import { RequireRole } from "@/routes/guards";
import { isAdmin } from "@/lib/permissions";

function canAccessTeacherPortal(user) {
  return Boolean(user.isTeacher) || user.role === "MENTOR" || isAdmin(user);
}

export default function TeacherLayout() {
  return (
    <RequireRole check={canAccessTeacherPortal}>
      <TeacherShell>
        <Outlet />
      </TeacherShell>
    </RequireRole>
  );
}
