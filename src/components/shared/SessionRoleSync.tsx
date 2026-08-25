"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

const CHECK_INTERVAL_MS = 60_000; // 1 daqiqada bir marta tekshiradi

type RefreshResponse = {
  skip?: boolean;
  error?: string;
  role?: string;
  isActive?: boolean;
  canManageLeads?: boolean;
  canManageCourses?: boolean;
  canManageUsers?: boolean;
  canViewReports?: boolean;
  canExportData?: boolean;
  canSeePayments?: boolean;
  canManagePayments?: boolean;
  canSeeStudentContacts?: boolean;
  canManageAttendance?: boolean;
  canManageGrades?: boolean;
  canSeeReports?: boolean;
  canManageExpenses?: boolean;
};

const WATCHED_FIELDS = [
  "role", "canManageLeads", "canManageCourses", "canManageUsers", "canViewReports",
  "canExportData", "canSeePayments", "canManagePayments", "canSeeStudentContacts",
  "canManageAttendance", "canManageGrades", "canSeeReports", "canManageExpenses",
] as const;

/**
 * Admin birovning rolini yoki ruxsatlarini Sozlamalar orqali o'zgartirsa, o'sha
 * foydalanuvchining brauzerida saqlangan sessiya (JWT) buni darhol bilmaydi —
 * odatda faqat qayta login qilganda yangilanadi. Bu komponent fonda davriy
 * ravishda tekshirib, o'zgarish bo'lsa sessiyani avtomatik yangilaydi.
 */
export default function SessionRoleSync() {
  const { data: session, update } = useSession();
  const checking = useRef(false);

  useEffect(() => {
    if (!session?.user || session.user.accountType === "student") return;

    const check = async () => {
      if (checking.current) return;
      checking.current = true;
      try {
        const res = await fetch("/api/auth/refresh");
        if (!res.ok) return;
        const fresh: RefreshResponse = await res.json();
        if (fresh.skip || fresh.error) return;

        const changed = WATCHED_FIELDS.some((f) => {
          const current = (session.user as unknown as Record<string, unknown>)[f];
          return fresh[f] !== undefined && fresh[f] !== current;
        });
        if (changed) {
          await update(fresh);
        }
      } catch {
        // Jim tur — bu shunchaki fon tekshiruvi, xato bo'lsa keyingi safar qayta urinadi
      } finally {
        checking.current = false;
      }
    };

    const interval = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  return null;
}
