import { Role } from "@/generated/prisma/client";
import type { Session } from "next-auth";

type UserSession = Session["user"] & {
  role: Role;
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
};

export function isSuperAdmin(user: UserSession) {
  return user.role === "SUPER_ADMIN";
}

export function isAdmin(user: UserSession) {
  return user.role === "SUPER_ADMIN" || user.role === "ADMIN";
}

export function isManager(user: UserSession) {
  return ["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(user.role);
}

export function canManageLeads(user: UserSession) {
  return user.canManageLeads || isAdmin(user);
}

export function canManageCourses(user: UserSession) {
  return user.canManageCourses || isAdmin(user);
}

export function canManageUsers(user: UserSession) {
  return user.canManageUsers || isSuperAdmin(user);
}

export function canViewReports(user: UserSession) {
  return user.canViewReports || isManager(user);
}

export function canExportData(user: UserSession) {
  return user.canExportData || isAdmin(user);
}

export function canDeleteLead(user: UserSession) {
  return isAdmin(user);
}

export function canAssignLead(user: UserSession) {
  return isManager(user);
}

export function canViewAllLeads(user: UserSession) {
  return isManager(user);
}

export function canViewSystemSettings(user: UserSession) {
  return isSuperAdmin(user);
}

// Portal-scoped permission flags (teacher / reception / finance), admin-managed per user.
export function canSeePayments(user: UserSession) {
  return user.canSeePayments || isAdmin(user);
}

export function canManagePayments(user: UserSession) {
  return user.canManagePayments || isAdmin(user);
}

export function canSeeStudentContacts(user: UserSession) {
  return user.canSeeStudentContacts || isAdmin(user);
}

export function canManageAttendance(user: UserSession) {
  return user.canManageAttendance || isAdmin(user);
}

export function canManageGrades(user: UserSession) {
  return user.canManageGrades || isAdmin(user);
}

export function canSeeReports(user: UserSession) {
  return user.canSeeReports || isAdmin(user);
}

export function canManageExpenses(user: UserSession) {
  return user.canManageExpenses || isAdmin(user);
}

// Where a user lands right after login. Single source of truth so the login page
// (and any future post-auth redirect) can't drift out of sync with each other.
//
// Reception/Accountant intentionally land on /dashboard for now — they don't have
// a dedicated home route yet (planned: /reception and /finance once those portals
// cover the full workflow), so they fall through to the /dashboard default below.
export function getHomeRouteForUser(user: Session["user"]): string {
  if (user.accountType === "student") return "/student/dashboard";
  if (isAdmin(user)) return "/dashboard";
  if (user.isTeacher || user.role === "MENTOR") return "/teacher/dashboard";
  return "/dashboard";
}

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  MANAGER: "Menejjer",
  OPERATOR: "Operator",
  MENTOR: "Mentor",
  RECEPTION: "Reception",
  ACCOUNTANT: "Buxgalter",
  STUDENT: "O'quvchi",
};

export const ROLE_COLORS: Record<Role, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  ADMIN: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  MANAGER: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  OPERATOR: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  MENTOR: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  RECEPTION: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  ACCOUNTANT: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  STUDENT: "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200",
};
