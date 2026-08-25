import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "../lib/db.js";
import { ah, requireRole } from "../lib/http.js";
import { PERMISSION_CATALOG } from "../lib/permission-catalog.js";

const router = Router();
const adminOnly = requireRole("SUPER_ADMIN", "ADMIN");

// Existing boolean flags this User already has -> the new Permission catalog rows they
// should map to. Run once after the tables below exist, so nobody's current access is
// silently revoked when the granular system takes over enforcement for these modules.
const FLAG_BRIDGE = [
  { flag: "canManageLeads", module: "leads", actions: ["add", "edit", "delete", "view", "access"] },
  { flag: "canManageCourses", module: "courses", actions: ["create", "edit", "delete", "view", "access"] },
  { flag: "canManageUsers", module: "staff", actions: ["add", "edit", "delete", "view_schedule", "access"] },
  { flag: "canManageExpenses", module: "expenses", actions: ["add", "edit", "delete", "view", "access"] },
  { flag: "canManageAttendance", module: "attendance", actions: ["mark", "edit", "delete", "view", "access"] },
  { flag: "canManageGrades", module: "grades", actions: ["access", "add"] },
];

// Idempotent DDL run THROUGH the app's Supabase connection.
// Admin-only. Safe to call repeatedly (IF NOT EXISTS).
const statements = [
  // ---- Part 1: Finance (Expense, Income, SalaryRecord) ----
  `CREATE TABLE IF NOT EXISTS "Expense" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "category" TEXT NOT NULL,
    "note" TEXT,
    "spentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
  )`,
  `DO $$ BEGIN ALTER TABLE "Expense" ADD CONSTRAINT "Expense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE INDEX IF NOT EXISTS "Expense_spentAt_idx" ON "Expense"("spentAt")`,

  `CREATE TABLE IF NOT EXISTS "Income" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "source" TEXT NOT NULL,
    "note" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Income_pkey" PRIMARY KEY ("id")
  )`,
  `DO $$ BEGIN ALTER TABLE "Income" ADD CONSTRAINT "Income_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE INDEX IF NOT EXISTS "Income_receivedAt_idx" ON "Income"("receivedAt")`,

  `CREATE TABLE IF NOT EXISTS "SalaryRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "month" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'salary',
    "note" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SalaryRecord_pkey" PRIMARY KEY ("id")
  )`,
  `DO $$ BEGIN ALTER TABLE "SalaryRecord" ADD CONSTRAINT "SalaryRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN ALTER TABLE "SalaryRecord" ADD CONSTRAINT "SalaryRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE INDEX IF NOT EXISTS "SalaryRecord_month_idx" ON "SalaryRecord"("month")`,

  // ---- Part 2: Payment discount + PaymentType ----
  `ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "discount" DECIMAL(12,2)`,
  `CREATE TABLE IF NOT EXISTS "PaymentType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentType_pkey" PRIMARY KEY ("id")
  )`,

  // ---- Part 3: Exams, Scores, Coins ----
  `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "coins" INTEGER NOT NULL DEFAULT 0`,
  `CREATE TABLE IF NOT EXISTS "Exam" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'exam',
    "courseId" TEXT,
    "groupId" TEXT,
    "date" DATE NOT NULL,
    "maxScore" INTEGER NOT NULL DEFAULT 100,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
  )`,
  `DO $$ BEGIN ALTER TABLE "Exam" ADD CONSTRAINT "Exam_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN ALTER TABLE "Exam" ADD CONSTRAINT "Exam_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN ALTER TABLE "Exam" ADD CONSTRAINT "Exam_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE INDEX IF NOT EXISTS "Exam_date_idx" ON "Exam"("date")`,

  `CREATE TABLE IF NOT EXISTS "Score" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Score_pkey" PRIMARY KEY ("id")
  )`,
  `DO $$ BEGIN ALTER TABLE "Score" ADD CONSTRAINT "Score_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN ALTER TABLE "Score" ADD CONSTRAINT "Score_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Score_examId_leadId_key" ON "Score"("examId","leadId")`,
  `CREATE INDEX IF NOT EXISTS "Score_leadId_idx" ON "Score"("leadId")`,

  `CREATE TABLE IF NOT EXISTS "CoinTx" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CoinTx_pkey" PRIMARY KEY ("id")
  )`,
  `DO $$ BEGIN ALTER TABLE "CoinTx" ADD CONSTRAINT "CoinTx_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN ALTER TABLE "CoinTx" ADD CONSTRAINT "CoinTx_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE INDEX IF NOT EXISTS "CoinTx_leadId_idx" ON "CoinTx"("leadId")`,

  // ---- Part 4: frozen, referral, archive, holidays, audit ----
  `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "frozenAt" TIMESTAMP(3)`,
  `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "frozenUntil" TIMESTAMP(3)`,
  `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "referrerName" TEXT`,
  `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "referrerPhone" TEXT`,
  `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "isArchived" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "isArchived" BOOLEAN NOT NULL DEFAULT false`,
  `CREATE TABLE IF NOT EXISTS "Holiday" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Holiday_date_key" ON "Holiday"("date")`,
  `CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt")`,

  // ---- Part 5: performance indexes ----
  `CREATE INDEX IF NOT EXISTS "Lead_status_idx" ON "Lead"("status")`,
  `CREATE INDEX IF NOT EXISTS "Lead_createdAt_idx" ON "Lead"("createdAt")`,
  `CREATE INDEX IF NOT EXISTS "Lead_phone_idx" ON "Lead"("phone")`,
  `CREATE INDEX IF NOT EXISTS "Lead_assignedToId_idx" ON "Lead"("assignedToId")`,
  `CREATE INDEX IF NOT EXISTS "Lead_courseId_idx" ON "Lead"("courseId")`,
  `CREATE INDEX IF NOT EXISTS "Lead_isArchived_idx" ON "Lead"("isArchived")`,
  `CREATE INDEX IF NOT EXISTS "Payment_leadId_idx" ON "Payment"("leadId")`,
  `CREATE INDEX IF NOT EXISTS "Payment_createdAt_idx" ON "Payment"("createdAt")`,
  `CREATE INDEX IF NOT EXISTS "Attendance_leadId_date_idx" ON "Attendance"("leadId","date")`,
  `CREATE INDEX IF NOT EXISTS "Activity_leadId_idx" ON "Activity"("leadId")`,
  `CREATE INDEX IF NOT EXISTS "Reminder_leadId_idx" ON "Reminder"("leadId")`,

  // ---- Part 6: StaffAttendance, Task ----
  `CREATE TABLE IF NOT EXISTS "StaffAttendance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'absent',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StaffAttendance_pkey" PRIMARY KEY ("id")
  )`,
  `DO $$ BEGIN ALTER TABLE "StaffAttendance" ADD CONSTRAINT "StaffAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "StaffAttendance_userId_date_key" ON "StaffAttendance"("userId","date")`,
  `CREATE INDEX IF NOT EXISTS "StaffAttendance_userId_date_idx" ON "StaffAttendance"("userId","date")`,
  `CREATE INDEX IF NOT EXISTS "StaffAttendance_date_idx" ON "StaffAttendance"("date")`,

  `DO $$ BEGIN CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE TABLE IF NOT EXISTS "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "type" TEXT,
    "assignedToId" TEXT,
    "createdById" TEXT,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
  )`,
  `DO $$ BEGIN ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE INDEX IF NOT EXISTS "Task_assignedToId_idx" ON "Task"("assignedToId")`,
  `CREATE INDEX IF NOT EXISTS "Task_status_idx" ON "Task"("status")`,
  `CREATE INDEX IF NOT EXISTS "Task_dueDate_idx" ON "Task"("dueDate")`,

  `CREATE TABLE IF NOT EXISTS "_TagToTask" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_TagToTask_AB_pkey" PRIMARY KEY ("A", "B")
  )`,
  `CREATE INDEX IF NOT EXISTS "_TagToTask_B_index" ON "_TagToTask"("B")`,
  `DO $$ BEGIN ALTER TABLE "_TagToTask" ADD CONSTRAINT "_TagToTask_A_fkey" FOREIGN KEY ("A") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN ALTER TABLE "_TagToTask" ADD CONSTRAINT "_TagToTask_B_fkey" FOREIGN KEY ("B") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

  // ---- Part 7: remove multi-branch support (feature removed) ----
  `ALTER TABLE "Lead" DROP CONSTRAINT IF EXISTS "Lead_branchId_fkey"`,
  `DROP INDEX IF EXISTS "Lead_branchId_idx"`,
  `ALTER TABLE "Lead" DROP COLUMN IF EXISTS "branchId"`,

  `ALTER TABLE "Group" DROP CONSTRAINT IF EXISTS "Group_branchId_fkey"`,
  `DROP INDEX IF EXISTS "Group_branchId_idx"`,
  `ALTER TABLE "Group" DROP COLUMN IF EXISTS "branchId"`,

  `ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_branchId_fkey"`,
  `DROP INDEX IF EXISTS "User_branchId_idx"`,
  `ALTER TABLE "User" DROP COLUMN IF EXISTS "branchId"`,

  `ALTER TABLE "Payment" DROP CONSTRAINT IF EXISTS "Payment_branchId_fkey"`,
  `DROP INDEX IF EXISTS "Payment_branchId_idx"`,
  `ALTER TABLE "Payment" DROP COLUMN IF EXISTS "branchId"`,

  `ALTER TABLE "Expense" DROP CONSTRAINT IF EXISTS "Expense_branchId_fkey"`,
  `DROP INDEX IF EXISTS "Expense_branchId_idx"`,
  `ALTER TABLE "Expense" DROP COLUMN IF EXISTS "branchId"`,

  `ALTER TABLE "Income" DROP CONSTRAINT IF EXISTS "Income_branchId_fkey"`,
  `DROP INDEX IF EXISTS "Income_branchId_idx"`,
  `ALTER TABLE "Income" DROP COLUMN IF EXISTS "branchId"`,

  `ALTER TABLE "Course" DROP CONSTRAINT IF EXISTS "Course_branchId_fkey"`,
  `DROP INDEX IF EXISTS "Course_branchId_idx"`,
  `ALTER TABLE "Course" DROP COLUMN IF EXISTS "branchId"`,

  `DROP TABLE IF EXISTS "Branch"`,

  // O'qituvchi paneli jadvallari (LessonScore, Exercise, ExerciseScore, HomeworkSubmission)
  `CREATE TABLE IF NOT EXISTS "LessonScore" (
    "id" TEXT PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "score" INTEGER NOT NULL,
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "LessonScore_groupId_leadId_date_key" ON "LessonScore"("groupId","leadId","date")`,
  `CREATE INDEX IF NOT EXISTS "LessonScore_groupId_date_idx" ON "LessonScore"("groupId","date")`,
  `CREATE INDEX IF NOT EXISTS "LessonScore_leadId_date_idx" ON "LessonScore"("leadId","date")`,

  `CREATE TABLE IF NOT EXISTS "Exercise" (
    "id" TEXT PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "title" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS "Exercise_groupId_date_idx" ON "Exercise"("groupId","date")`,

  `CREATE TABLE IF NOT EXISTS "ExerciseScore" (
    "id" TEXT PRIMARY KEY,
    "exerciseId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ExerciseScore_exerciseId_leadId_key" ON "ExerciseScore"("exerciseId","leadId")`,
  `CREATE INDEX IF NOT EXISTS "ExerciseScore_leadId_idx" ON "ExerciseScore"("leadId")`,

  `CREATE TABLE IF NOT EXISTS "HomeworkSubmission" (
    "id" TEXT PRIMARY KEY,
    "exerciseId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "content" TEXT,
    "status" TEXT NOT NULL DEFAULT 'unchecked',
    "grade" INTEGER,
    "teacherNote" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
    "checkedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "HomeworkSubmission_exerciseId_leadId_key" ON "HomeworkSubmission"("exerciseId","leadId")`,
  `CREATE INDEX IF NOT EXISTS "HomeworkSubmission_exerciseId_idx" ON "HomeworkSubmission"("exerciseId")`,
  `CREATE INDEX IF NOT EXISTS "HomeworkSubmission_leadId_idx" ON "HomeworkSubmission"("leadId")`,
  `CREATE INDEX IF NOT EXISTS "HomeworkSubmission_status_idx" ON "HomeworkSubmission"("status")`,

  // Yagona login + rollar: yangi rollar va admin boshqaradigan ruxsat bayroqlari
  `ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'RECEPTION'`,
  `ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ACCOUNTANT'`,
  `ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'MENTOR'`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "canSeePayments" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "canManagePayments" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "canSeeStudentContacts" BOOLEAN NOT NULL DEFAULT true`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "canManageAttendance" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "canManageGrades" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "canSeeReports" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "canManageExpenses" BOOLEAN NOT NULL DEFAULT false`,
  // Teacher-role defaults: attendance/grades on, payments off (matches the "har rol uchun standart to'plam" requirement)
  `UPDATE "User" SET "canManageAttendance" = true, "canManageGrades" = true WHERE "id" IN (SELECT DISTINCT "teacherId" FROM "Group" WHERE "teacherId" IS NOT NULL)`,
  `UPDATE "User" SET "canSeePayments" = true, "canManagePayments" = true, "canSeeReports" = true WHERE "role" = 'ACCOUNTANT'`,
  `UPDATE "User" SET "canManageLeads" = true, "canSeeStudentContacts" = true WHERE "role" = 'RECEPTION'`,

  // O'quvchi (Lead) login: telefon + kod
  `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "loginCode" TEXT`,
  `ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'STUDENT'`,

  // Ruxsatlar katalogi (Permission / UserPermission) — rows are seeded separately below.
  `CREATE TABLE IF NOT EXISTS "Permission" (
    "id" TEXT PRIMARY KEY,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Permission_module_action_key" ON "Permission"("module","action")`,

  `CREATE TABLE IF NOT EXISTS "UserPermission" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now()
  )`,
  `DO $$ BEGIN ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "UserPermission_userId_permissionId_key" ON "UserPermission"("userId","permissionId")`,
  `CREATE INDEX IF NOT EXISTS "UserPermission_userId_idx" ON "UserPermission"("userId")`,
];

// POST /api/admin/migrate
router.post("/migrate", adminOnly, ah(async (req, res) => {
  const results = [];
  for (let i = 0; i < statements.length; i++) {
    try {
      await db.$executeRawUnsafe(statements[i]);
      results.push({ i, status: "ok" });
    } catch (e) {
      results.push({ i, status: "ERROR: " + (e instanceof Error ? e.message : String(e)) });
    }
  }
  const ok = results.every((r) => r.status === "ok");

  // Seed the permission catalog (idempotent upsert) and bridge existing boolean flags
  // into initial grants, so this is safe to call repeatedly.
  let seeded = 0;
  let bridged = 0;
  try {
    for (const p of PERMISSION_CATALOG) {
      await db.permission.upsert({
        where: { module_action: { module: p.module, action: p.action } },
        update: { label: p.label, tier: p.tier },
        create: { module: p.module, action: p.action, label: p.label, tier: p.tier },
      });
      seeded++;
    }

    const usersWithFlags = await db.user.findMany({
      select: {
        id: true,
        canManageLeads: true, canManageCourses: true, canManageUsers: true,
        canManageExpenses: true, canManageAttendance: true, canManageGrades: true,
      },
    });
    for (const bridge of FLAG_BRIDGE) {
      const permissions = await db.permission.findMany({
        where: { module: bridge.module, action: { in: bridge.actions } },
        select: { id: true },
      });
      for (const user of usersWithFlags) {
        const granted = !!user[bridge.flag];
        if (!granted) continue;
        for (const perm of permissions) {
          await db.userPermission.upsert({
            where: { userId_permissionId: { userId: user.id, permissionId: perm.id } },
            update: {},
            create: { userId: user.id, permissionId: perm.id, granted: true },
          });
          bridged++;
        }
      }
    }
  } catch (e) {
    return res.json({ done: true, ok, results, seedError: e instanceof Error ? e.message : String(e) });
  }

  res.json({ done: true, ok, results, seeded, bridged });
}));

// One-off, admin-only staff import. Idempotent: an existing username is left
// completely untouched (including its password), so re-running never resets a
// staff member who has already changed theirs.
const SHARED_PASSWORD = "robo9005";
const BCRYPT_ROUNDS = 12;

const STAFF = [
  { fullName: "Abdumalikov Abdulqodir", username: "abdulqodir", phone: "+998936175055" },
  { fullName: "Azimjonov Akmaljon", username: "akmaljon", phone: "+998934465886" },
  { fullName: "Foziljonov Abdulloh", username: "abdulloh", phone: "+998932518222" },
  { fullName: "Madaminov Firdavs", username: "firdavs", phone: "+998907551523" },
  { fullName: "Dovudbek", username: "dovudbek", phone: "+998916200920" },
  { fullName: "Nazrulloh", username: "nazrulloh", phone: "+998914933446" },
  { fullName: "Zafarov Hasanboy", username: "hasanboy", phone: "+998939630313" },
  { fullName: "Saidmurod", username: "saidmurod", phone: "+998509701576" },
  { fullName: "Zafarov Xusanboy", username: "xusanboy", phone: "+998941869127" },
  { fullName: "Saidislom To'lqinov", username: "saidislom", phone: "+998979644212" },
  { fullName: "Mushtariy", username: "mushtariy", phone: "+998934733438" },
];

// POST /api/admin/seed-staff
router.post("/seed-staff", adminOnly, ah(async (req, res) => {
  const usernames = STAFF.map((s) => s.username);
  const existing = await db.user.findMany({
    where: { username: { in: usernames } },
    select: { username: true },
  });
  const existingSet = new Set(existing.map((u) => u.username));

  const created = [];
  const skipped = [...existingSet];

  for (const staff of STAFF) {
    if (existingSet.has(staff.username)) continue;

    // Hash per user so each row gets its own salt, and only for rows we are
    // actually inserting — no wasted work on a re-run.
    const passwordHash = await bcrypt.hash(SHARED_PASSWORD, BCRYPT_ROUNDS);

    await db.user.upsert({
      where: { username: staff.username },
      // Empty update keeps upsert idempotent if the row appeared between the
      // findMany above and this write.
      update: {},
      create: {
        fullName: staff.fullName,
        username: staff.username,
        phone: staff.phone,
        passwordHash,
        role: "OPERATOR",
        isActive: true,
        canManageLeads: true,
        canManageCourses: false,
        canManageUsers: false,
        canViewReports: false,
        canExportData: false,
      },
    });
    created.push(staff.username);
  }

  res.json({ ok: true, created: created.length, createdUsernames: created, skipped });
}));

export default router;
