// Ported from the Next.js app's src/lib/permissions.ts — same functions/labels,
// TypeScript types stripped (this backend is plain JS).

export function isSuperAdmin(user) {
  return user.role === "SUPER_ADMIN";
}

export function isAdmin(user) {
  return user.role === "SUPER_ADMIN" || user.role === "ADMIN";
}

export function isManager(user) {
  return ["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(user.role);
}

export function canManageLeads(user) {
  return user.canManageLeads || isAdmin(user);
}

export function canManageCourses(user) {
  return user.canManageCourses || isAdmin(user);
}

export function canManageUsers(user) {
  return user.canManageUsers || isSuperAdmin(user);
}

export function canViewReports(user) {
  return user.canViewReports || isManager(user);
}

export function canExportData(user) {
  return user.canExportData || isAdmin(user);
}

export function canDeleteLead(user) {
  return isAdmin(user);
}

export function canAssignLead(user) {
  return isManager(user);
}

export function canViewAllLeads(user) {
  return isManager(user);
}

export function canViewSystemSettings(user) {
  return isSuperAdmin(user);
}

// Portal-scoped permission flags (teacher / reception / finance), admin-managed per user.
export function canSeePayments(user) {
  return user.canSeePayments || isAdmin(user);
}

export function canManagePayments(user) {
  return user.canManagePayments || isAdmin(user);
}

export function canSeeStudentContacts(user) {
  return user.canSeeStudentContacts || isAdmin(user);
}

export function canManageAttendance(user) {
  return user.canManageAttendance || isAdmin(user);
}

export function canManageGrades(user) {
  return user.canManageGrades || isAdmin(user);
}

export function canSeeReports(user) {
  return user.canSeeReports || isAdmin(user);
}

export function canManageExpenses(user) {
  return user.canManageExpenses || isAdmin(user);
}

// Where a user lands right after login. Single source of truth so the login page
// (and any future post-auth redirect) can't drift out of sync with each other.
//
// Reception/Accountant intentionally land on /dashboard for now — they don't have
// a dedicated home route yet (planned: /reception and /finance once those portals
// cover the full workflow), so they fall through to the /dashboard default below.
export function getHomeRouteForUser(user) {
  if (user.accountType === "student") return "/student/dashboard";
  if (isAdmin(user)) return "/dashboard";
  if (user.isTeacher || user.role === "MENTOR") return "/teacher/dashboard";
  return "/dashboard";
}

export const ROLE_LABELS = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  MANAGER: "Menejjer",
  OPERATOR: "Operator",
  MENTOR: "Mentor",
  RECEPTION: "Reception",
  ACCOUNTANT: "Buxgalter",
  STUDENT: "O'quvchi",
};

export const ROLE_COLORS = {
  SUPER_ADMIN: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  ADMIN: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  MANAGER: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  OPERATOR: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  MENTOR: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  RECEPTION: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  ACCOUNTANT: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  STUDENT: "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200",
};
