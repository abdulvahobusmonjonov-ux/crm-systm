// Butun ilovaning yo'llar jadvali.
//
// Manzillar Next.js versiyasidagi bilan bir xil: `(dashboard)` route group
// bo'lgani uchun uning sahifalari `/leads`, `/settings` kabi yuqori darajada
// turadi — shuning uchun bu yerda ular "pathless" layout route ichida.
// Sidebar/CommandPalette'dagi barcha havolalar shu sababli tegilmadi.
import { Route, Routes } from "react-router-dom";

import DashboardLayout from "@/layouts/DashboardLayout";
import TeacherLayout from "@/layouts/TeacherLayout";
import StudentLayout from "@/layouts/StudentLayout";
import { FinanceLayout, ReceptionLayout } from "@/layouts/PortalLayout";

// Ochiq sahifalar
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import ApplyPage from "@/pages/ApplyPage";
import ReceiptPage from "@/pages/ReceiptPage";
import MiniappProfilePage from "@/pages/MiniappProfilePage";
import NotFoundPage from "@/pages/NotFoundPage";

// Boshqaruv paneli
import AnalyticsPage from "@/pages/AnalyticsPage";
import AttendancePage from "@/pages/AttendancePage";
import BonusesPage from "@/pages/BonusesPage";
import CashflowPage from "@/pages/CashflowPage";
import ChangelogPage from "@/pages/ChangelogPage";
import CoursesPage from "@/pages/CoursesPage";
import DashboardPage from "@/pages/DashboardPage";
import DebtorsPage from "@/pages/DebtorsPage";
import ExamsPage from "@/pages/ExamsPage";
import ExpensesPage from "@/pages/ExpensesPage";
import FinancialReportPage from "@/pages/FinancialReportPage";
import GroupsPage from "@/pages/GroupsPage";
import IncomesPage from "@/pages/IncomesPage";
import LeaderboardPage from "@/pages/LeaderboardPage";
import LeadDetailPage from "@/pages/LeadDetailPage";
import LeadsKanbanPage from "@/pages/LeadsKanbanPage";
import LeadsNewPage from "@/pages/LeadsNewPage";
import LeadsPage from "@/pages/LeadsPage";
import LogsPage from "@/pages/LogsPage";
import PaymentsPage from "@/pages/PaymentsPage";
import PayrollPage from "@/pages/PayrollPage";
import PermissionsPage from "@/pages/PermissionsPage";
import ProfilePage from "@/pages/ProfilePage";
import RemindersPage from "@/pages/RemindersPage";
import ReportsPage from "@/pages/ReportsPage";
import SchedulePage from "@/pages/SchedulePage";
import SettingsPage from "@/pages/SettingsPage";
import StaffAttendancePage from "@/pages/StaffAttendancePage";
import StudentDetailPage from "@/pages/StudentDetailPage";
import StudentsPage from "@/pages/StudentsPage";
import TasksPage from "@/pages/TasksPage";
import TeacherReportPage from "@/pages/TeacherReportPage";
import TeachersPage from "@/pages/TeachersPage";
import TimetablePage from "@/pages/TimetablePage";
import UnauthorizedPage from "@/pages/UnauthorizedPage";
import UsersPage from "@/pages/UsersPage";

// O'qituvchi kabineti
import TeacherDashboardPage from "@/pages/TeacherDashboardPage";
import TeacherGroupPage from "@/pages/TeacherGroupPage";
import TeacherHomeworkPage from "@/pages/TeacherHomeworkPage";
import TeacherProfilePage from "@/pages/TeacherProfilePage";
import TeacherStudentPage from "@/pages/TeacherStudentPage";
import TeacherStudentsPage from "@/pages/TeacherStudentsPage";

// O'quvchi kabineti + portallar
import StudentDashboardPage from "@/pages/StudentDashboardPage";
import FinancePage from "@/pages/FinancePage";
import ReceptionPage from "@/pages/ReceptionPage";

export default function App() {
  return (
    <Routes>
      {/* --- Ochiq sahifalar --- */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/apply" element={<ApplyPage />} />
      <Route path="/receipt/:id" element={<ReceiptPage />} />
      <Route path="/miniapp/profil" element={<MiniappProfilePage />} />

      {/* --- Boshqaruv paneli (sobiq "(dashboard)" route group) --- */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/bonuses" element={<BonusesPage />} />
        <Route path="/cashflow" element={<CashflowPage />} />
        <Route path="/changelog" element={<ChangelogPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/debtors" element={<DebtorsPage />} />
        <Route path="/exams" element={<ExamsPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/financial-report" element={<FinancialReportPage />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/incomes" element={<IncomesPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/leads/kanban" element={<LeadsKanbanPage />} />
        <Route path="/leads/new" element={<LeadsNewPage />} />
        <Route path="/leads/:id" element={<LeadDetailPage />} />
        <Route path="/logs" element={<LogsPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/payroll" element={<PayrollPage />} />
        <Route path="/permissions" element={<PermissionsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/reminders" element={<RemindersPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/staff-attendance" element={<StaffAttendancePage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/students/:id" element={<StudentDetailPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/teacher-report" element={<TeacherReportPage />} />
        <Route path="/teachers" element={<TeachersPage />} />
        <Route path="/timetable" element={<TimetablePage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/users" element={<UsersPage />} />
      </Route>

      {/* --- O'qituvchi kabineti --- */}
      <Route path="/teacher" element={<TeacherLayout />}>
        <Route path="dashboard" element={<TeacherDashboardPage />} />
        <Route path="groups/:id" element={<TeacherGroupPage />} />
        <Route path="homework" element={<TeacherHomeworkPage />} />
        <Route path="profile" element={<TeacherProfilePage />} />
        <Route path="students" element={<TeacherStudentsPage />} />
        <Route path="students/:id" element={<TeacherStudentPage />} />
      </Route>

      {/* --- O'quvchi kabineti --- */}
      <Route path="/student" element={<StudentLayout />}>
        <Route path="dashboard" element={<StudentDashboardPage />} />
      </Route>

      {/* --- Buxgalter va Reception portallari --- */}
      <Route path="/finance" element={<FinanceLayout />}>
        <Route index element={<FinancePage />} />
      </Route>
      <Route path="/reception" element={<ReceptionLayout />}>
        <Route index element={<ReceptionPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
