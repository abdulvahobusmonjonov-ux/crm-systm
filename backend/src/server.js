import "dotenv/config";
import express from "express";
import cors from "cors";
import { z } from "zod";
import { login, authMiddleware } from "./lib/auth.js";
import { db } from "./lib/db.js";
import { ah } from "./lib/http.js";

import leadsRouter from "./routes/leads.js";
import usersRouter from "./routes/users.js";
import coursesRouter from "./routes/courses.js";
import teachersRouter from "./routes/teachers.js";
import groupsRouter from "./routes/groups.js";
import stagesRouter from "./routes/stages.js";
import tagsRouter from "./routes/tags.js";
import timeslotsRouter from "./routes/timeslots.js";
import holidaysRouter from "./routes/holidays.js";
import attendanceRouter from "./routes/attendance.js";
import staffAttendanceRouter from "./routes/staff-attendance.js";
import paymentTypesRouter from "./routes/payment-types.js";
import paymentsRouter from "./routes/payments.js";
import expensesRouter from "./routes/expenses.js";
import incomesRouter from "./routes/incomes.js";
import payrollRouter from "./routes/payroll.js";
import debtorsRouter from "./routes/debtors.js";
import cashflowRouter from "./routes/cashflow.js";
import examsRouter from "./routes/exams.js";
import tasksRouter from "./routes/tasks.js";
import remindersRouter from "./routes/reminders.js";
import { logsRouter, leaderboardRouter } from "./routes/misc.js";
import dashboardRouter from "./routes/dashboard.js";
import analyticsRouter from "./routes/analytics.js";
import reportsRouter from "./routes/reports.js";
import settingsRouter from "./routes/settings.js";
import permissionsRouter from "./routes/permissions.js";
import adminRouter from "./routes/admin.js";
import smsRouter from "./routes/sms.js";
import studentRouter from "./routes/student.js";
import teacherRouter from "./routes/teacher.js";
import cronRouter from "./routes/cron.js";
import publicRouter from "./routes/public.js";
import brandingRouter from "./routes/branding.js";
import { telegramAdminRouter, telegramPublicRouter } from "./routes/telegram.js";

const app = express();
const PORT = process.env.PORT || 4000;

// Dev'da har qanday localhost portiga (5173, 5174, ...) ruxsat beramiz.
// Productionда FRONTEND_ORIGIN o'rnatilsa — faqat o'sha originga ruxsat.
const allowedOrigin = (origin, cb) => {
  if (!origin) return cb(null, true); // Postman/curl kabi originsiz so'rovlar
  if (process.env.FRONTEND_ORIGIN && origin === process.env.FRONTEND_ORIGIN) return cb(null, true);
  if (/^http:\/\/localhost:\d+$/.test(origin)) return cb(null, true);
  if (/^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) return cb(null, true);
  return cb(null, false);
};
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json({ limit: "10mb" }));

// ---- Public (no auth) ----
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

const loginSchema = z.object({
  username: z.string().min(1, "Username yoki telefon kiritilishi shart"),
  password: z.string().min(1, "Parol kiritilishi shart"),
});

app.post("/api/auth/login", ah(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { username, password } = parsed.data;
  const result = await login(username, password);
  if (!result) return res.status(401).json({ error: "Login yoki parol noto'g'ri" });

  res.json(result);
}));

app.get("/api/auth/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// Admin birovning rolini yoki ruxsatlarini o'zgartirganda, o'sha foydalanuvchi qayta
// login qilmasdan ham yangi huquqlarini olishi uchun frontend shu route'ni davriy
// tekshiradi. JWT 7 kun yashagani uchun bu NextAuth'dagidan ham muhimroq.
app.get("/api/auth/refresh", authMiddleware, ah(async (req, res) => {
  // Talaba (Lead asosidagi) sessiyalarda id — User emas, Lead id, shuning uchun bu
  // yerni o'tkazib yuboramiz — talabaning roli/ruxsati o'zgarmaydi.
  if (req.user.accountType === "student") return res.json({ skip: true });

  const dbUser = await db.user.findUnique({
    where: { id: req.user.id },
    select: {
      role: true, isActive: true,
      canManageLeads: true, canManageCourses: true, canManageUsers: true,
      canViewReports: true, canExportData: true,
      canSeePayments: true, canManagePayments: true, canSeeStudentContacts: true,
      canManageAttendance: true, canManageGrades: true, canSeeReports: true,
      canManageExpenses: true,
    },
  });

  if (!dbUser || !dbUser.isActive) return res.status(404).json({ error: "Not found" });

  res.json(dbUser);
}));

// Unauthenticated by design: landing lead form, branding assets, Telegram's own
// callbacks (which authenticate via webhook secret / signed initData), and the
// cron jobs (which use CRON_SECRET).
app.use("/api/public", publicRouter);
app.use("/api/branding", brandingRouter);
app.use("/api/telegram", telegramPublicRouter);
app.use("/api/cron", cronRouter);

// ---- Authenticated ----
// Every router below sits behind authMiddleware, mirroring the `const session =
// await auth(); if (!session) return 401` prelude each Next.js route handler had.
app.use("/api/leads", authMiddleware, leadsRouter);
app.use("/api/users", authMiddleware, usersRouter);
app.use("/api/courses", authMiddleware, coursesRouter);
app.use("/api/teachers", authMiddleware, teachersRouter);
app.use("/api/groups", authMiddleware, groupsRouter);
app.use("/api/stages", authMiddleware, stagesRouter);
app.use("/api/tags", authMiddleware, tagsRouter);
app.use("/api/timeslots", authMiddleware, timeslotsRouter);
app.use("/api/holidays", authMiddleware, holidaysRouter);
app.use("/api/attendance", authMiddleware, attendanceRouter);
app.use("/api/staff-attendance", authMiddleware, staffAttendanceRouter);
app.use("/api/payment-types", authMiddleware, paymentTypesRouter);
app.use("/api/payments", authMiddleware, paymentsRouter);
app.use("/api/expenses", authMiddleware, expensesRouter);
app.use("/api/incomes", authMiddleware, incomesRouter);
app.use("/api/payroll", authMiddleware, payrollRouter);
app.use("/api/debtors", authMiddleware, debtorsRouter);
app.use("/api/cashflow", authMiddleware, cashflowRouter);
app.use("/api/exams", authMiddleware, examsRouter);
app.use("/api/tasks", authMiddleware, tasksRouter);
app.use("/api/reminders", authMiddleware, remindersRouter);
app.use("/api/logs", authMiddleware, logsRouter);
app.use("/api/leaderboard", authMiddleware, leaderboardRouter);
app.use("/api/dashboard", authMiddleware, dashboardRouter);
app.use("/api/analytics", authMiddleware, analyticsRouter);
app.use("/api/reports", authMiddleware, reportsRouter);
app.use("/api/settings", authMiddleware, settingsRouter);
app.use("/api/permissions", authMiddleware, permissionsRouter);
app.use("/api/admin", authMiddleware, adminRouter);
app.use("/api/sms", authMiddleware, smsRouter);
app.use("/api/student", authMiddleware, studentRouter);
app.use("/api/teacher", authMiddleware, teacherRouter);
app.use("/api/telegram", authMiddleware, telegramAdminRouter);

// ---- 404 + error handler ----
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err?.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
