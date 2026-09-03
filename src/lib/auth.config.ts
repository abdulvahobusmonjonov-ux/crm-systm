import type { NextAuthConfig } from "next-auth";

const PUBLIC_PATHS = ["/login", "/api/auth"];
// Exact-match only (unlike PUBLIC_PATHS above) — "/" as a prefix would match every route.
const PUBLIC_EXACT_PATHS = ["/"];
const TEACHER_PREFIX = "/teacher";
const RECEPTION_PREFIX = "/reception";
const FINANCE_PREFIX = "/finance";
const STUDENT_PREFIX = "/student";
const DASHBOARD_HOME_PATH = "/dashboard";
// Faqat admin (yoki xodimlarni boshqarish huquqi bo'lganlar) kira oladigan sahifalar —
// oddiy xodim (operator, reception va h.k.) manzilni to'g'ridan-to'g'ri yozib kirsa ham bloklanadi.
const ADMIN_ONLY_PREFIXES = ["/settings", "/users", "/permissions", "/logs"];

// Plain startsWith() would also match "/students"/"/teachers" (distinct admin list pages) against
// the "/student"/"/teacher" portal prefixes — require an exact match or a "/" boundary after it.
const pathIs = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(prefix + "/");

const isAdminRole = (role: string) => role === "SUPER_ADMIN" || role === "ADMIN";
// Sessions issued before the "student" account type existed have no accountType in their
// JWT yet — treat that as "staff" so already-logged-in admin/teacher sessions keep working.
const isStudent = (user: { accountType?: "staff" | "student" }) => user.accountType === "student";

// Teachers (Group.teacherId holders) land on their own panel; admins keep the regular dashboard
// even if they also happen to teach a group or hold the RECEPTION/ACCOUNTANT role. Students
// (Lead-based logins) always land on their own portal.
const landingPath = (user: { role: string; isTeacher: boolean; accountType?: "staff" | "student" }) => {
  if (isStudent(user)) return "/student/dashboard";
  if (isAdminRole(user.role)) return "/dashboard";
  if (user.isTeacher || user.role === "MENTOR") return "/teacher/dashboard";
  if (user.role === "RECEPTION") return "/reception";
  if (user.role === "ACCOUNTANT") return "/finance";
  return "/dashboard";
};

// Avatarni faqat kichik URL bo'lsa sessiyaga qo'shamiz.
// base64 (data:) rasm cookie'ni shishirib "REQUEST_HEADER_TOO_LARGE" (494) beradi.
const safeAvatar = (v: unknown): string | null =>
  typeof v === "string" && !v.startsWith("data:") && v.length < 512 ? v : null;

export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublic =
        PUBLIC_PATHS.some((p) => nextUrl.pathname.startsWith(p)) || PUBLIC_EXACT_PATHS.includes(nextUrl.pathname);

      if (!isPublic && !isLoggedIn) return false;

      if (isLoggedIn) {
        const user = auth!.user;
        if (nextUrl.pathname === "/login") {
          return Response.redirect(new URL(landingPath(user), nextUrl));
        }
        if (pathIs(nextUrl.pathname, TEACHER_PREFIX) && !user.isTeacher && user.role !== "MENTOR" && !isAdminRole(user.role)) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        // Admin's own home page — a teacher/mentor (who isn't also an admin) has no business
        // landing here directly (typed URL, stale bookmark, etc.); send them back to
        // their own portal instead of exposing the admin dashboard.
        if (nextUrl.pathname === DASHBOARD_HOME_PATH && (user.isTeacher || user.role === "MENTOR") && !isAdminRole(user.role)) {
          return Response.redirect(new URL(landingPath(user), nextUrl));
        }
        if (pathIs(nextUrl.pathname, RECEPTION_PREFIX) && user.role !== "RECEPTION" && !isAdminRole(user.role)) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        if (pathIs(nextUrl.pathname, FINANCE_PREFIX) && user.role !== "ACCOUNTANT" && !isAdminRole(user.role)) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        // Students' session id is a Lead id, not a User id — confine them to their own
        // portal so they never reach staff pages/APIs that assume session.user.id is a User.
        if (isStudent(user) && !pathIs(nextUrl.pathname, STUDENT_PREFIX) && !nextUrl.pathname.startsWith("/api/student")) {
          return Response.redirect(new URL("/student/dashboard", nextUrl));
        }
        if (pathIs(nextUrl.pathname, STUDENT_PREFIX) && !isStudent(user)) {
          return Response.redirect(new URL(landingPath(user), nextUrl));
        }
        if (
          ADMIN_ONLY_PREFIXES.some((p) => nextUrl.pathname.startsWith(p)) &&
          !isAdminRole(user.role) &&
          !user.canManageUsers
        ) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.fullName = user.fullName;
        token.avatarUrl = safeAvatar(user.avatarUrl);
        token.username = user.username;
        token.canManageLeads = user.canManageLeads;
        token.canManageCourses = user.canManageCourses;
        token.canManageUsers = user.canManageUsers;
        token.canViewReports = user.canViewReports;
        token.canExportData = user.canExportData;
        token.canSeePayments = user.canSeePayments;
        token.canManagePayments = user.canManagePayments;
        token.canSeeStudentContacts = user.canSeeStudentContacts;
        token.canManageAttendance = user.canManageAttendance;
        token.canManageGrades = user.canManageGrades;
        token.canSeeReports = user.canSeeReports;
        token.canManageExpenses = user.canManageExpenses;
        token.isTeacher = user.isTeacher;
        token.accountType = user.accountType;
      }
      // Client called useSession().update(partial) — e.g. after saving name/avatar on the profile page,
      // or after SessionRoleSync detected a role/permission change made by an admin elsewhere.
      if (trigger === "update" && session) {
        if (typeof session.fullName === "string") token.fullName = session.fullName;
        if ("avatarUrl" in session) token.avatarUrl = safeAvatar(session.avatarUrl);
        if (typeof session.role === "string") token.role = session.role;
        const boolFields = [
          "canManageLeads", "canManageCourses", "canManageUsers", "canViewReports", "canExportData",
          "canSeePayments", "canManagePayments", "canSeeStudentContacts", "canManageAttendance",
          "canManageGrades", "canSeeReports", "canManageExpenses",
        ] as const;
        for (const f of boolFields) {
          if (typeof session[f] === "boolean") token[f] = session[f];
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.fullName = token.fullName;
        session.user.avatarUrl = token.avatarUrl ?? null;
        session.user.username = token.username;
        session.user.canManageLeads = token.canManageLeads;
        session.user.canManageCourses = token.canManageCourses;
        session.user.canManageUsers = token.canManageUsers;
        session.user.canViewReports = token.canViewReports;
        session.user.canExportData = token.canExportData;
        session.user.canSeePayments = token.canSeePayments;
        session.user.canManagePayments = token.canManagePayments;
        session.user.canSeeStudentContacts = token.canSeeStudentContacts;
        session.user.canManageAttendance = token.canManageAttendance;
        session.user.canManageGrades = token.canManageGrades;
        session.user.canSeeReports = token.canSeeReports;
        session.user.canManageExpenses = token.canManageExpenses;
        session.user.isTeacher = token.isTeacher;
        session.user.accountType = token.accountType ?? "staff";
      }
      return session;
    },
  },
  providers: [],
};
