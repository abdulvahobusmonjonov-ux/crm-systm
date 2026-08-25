import type { Role } from "@/generated/prisma";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    role: Role;
    username: string;
    fullName: string;
    avatarUrl?: string | null;
    canManageLeads: boolean;
    canManageCourses: boolean;
    canManageUsers: boolean;
    canViewReports: boolean;
    canExportData: boolean;
    canSeePayments: boolean;
    canManagePayments: boolean;
    canSeeStudentContacts: boolean;
    canManageAttendance: boolean;
    canManageGrades: boolean;
    canSeeReports: boolean;
    canManageExpenses: boolean;
    isTeacher: boolean;
    // "student" sessions come from a Lead (via phone+code), not a User row — `id` is the
    // Lead id in that case, and none of the staff permission flags above are meaningful.
    accountType: "staff" | "student";
  }

  interface Session {
    user: User & {
      id: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    username: string;
    fullName: string;
    avatarUrl?: string | null;
    canManageLeads: boolean;
    canManageCourses: boolean;
    canManageUsers: boolean;
    canViewReports: boolean;
    canExportData: boolean;
    canSeePayments: boolean;
    canManagePayments: boolean;
    canSeeStudentContacts: boolean;
    canManageAttendance: boolean;
    canManageGrades: boolean;
    canSeeReports: boolean;
    canManageExpenses: boolean;
    isTeacher: boolean;
    // "student" sessions come from a Lead (via phone+code), not a User row — `id` is the
    // Lead id in that case, and none of the staff permission flags above are meaningful.
    accountType: "staff" | "student";
  }
}
