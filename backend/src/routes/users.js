import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "../lib/db.js";
import { ah } from "../lib/http.js";
import { hasPermission } from "../lib/rbac.js";

const router = Router();

const ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "OPERATOR", "MENTOR", "RECEPTION", "ACCOUNTANT"];

const createUserSchema = z.object({
  fullName: z.string().min(2, "Ism kamida 2 harf"),
  username: z.string().min(3, "Username kamida 3 harf").regex(/^[a-z0-9_]+$/, "Faqat kichik harf, raqam va _"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  password: z.string().min(8, "Parol kamida 8 ta belgi"),
  role: z.enum(ROLES),
  canManageLeads: z.boolean().default(true),
  canManageCourses: z.boolean().default(false),
  canManageUsers: z.boolean().default(false),
  canViewReports: z.boolean().default(false),
  canExportData: z.boolean().default(false),
  canSeePayments: z.boolean().default(false),
  canManagePayments: z.boolean().default(false),
  canSeeStudentContacts: z.boolean().default(true),
  canManageAttendance: z.boolean().default(false),
  canManageGrades: z.boolean().default(false),
  canSeeReports: z.boolean().default(false),
  canManageExpenses: z.boolean().default(false),
});

const updateSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  avatarUrl: z.string().optional(),
  role: z.enum(ROLES).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional(),
  oldPassword: z.string().optional(),
  canManageLeads: z.boolean().optional(),
  canManageCourses: z.boolean().optional(),
  canManageUsers: z.boolean().optional(),
  canViewReports: z.boolean().optional(),
  canExportData: z.boolean().optional(),
  canSeePayments: z.boolean().optional(),
  canManagePayments: z.boolean().optional(),
  canSeeStudentContacts: z.boolean().optional(),
  canManageAttendance: z.boolean().optional(),
  canManageGrades: z.boolean().optional(),
  canSeeReports: z.boolean().optional(),
  canManageExpenses: z.boolean().optional(),
  language: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  telegram: z.string().optional().nullable(),
});

const FULL_SELECT = {
  id: true, fullName: true, username: true, email: true, phone: true,
  role: true, isActive: true, avatarUrl: true, createdAt: true, lastLoginAt: true,
  canManageLeads: true, canManageCourses: true, canManageUsers: true,
  canViewReports: true, canExportData: true,
  canSeePayments: true, canManagePayments: true, canSeeStudentContacts: true,
  canManageAttendance: true, canManageGrades: true, canSeeReports: true,
  canManageExpenses: true,
  _count: { select: { leads: true } },
};

const LIMITED_SELECT = { id: true, fullName: true, role: true, isActive: true, avatarUrl: true };

// GET /api/users
router.get("/", ah(async (req, res) => {
  const currentUser = req.user;
  const isAdminRole = currentUser.role === "SUPER_ADMIN" || currentUser.role === "ADMIN";
  const canSeeFullList = isAdminRole || currentUser.canManageUsers;

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: canSeeFullList ? FULL_SELECT : LIMITED_SELECT,
  });

  res.json(users);
}));

// POST /api/users
router.post("/", ah(async (req, res) => {
  // Role/permission are deliberately re-read from the DB rather than trusted from
  // the token — a JWT issued before a demotion would otherwise still grant access.
  const dbUser = await db.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, role: true, canManageUsers: true },
  });
  if (!dbUser) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });

  const isAdminRole = dbUser.role === "SUPER_ADMIN" || dbUser.role === "ADMIN";
  const canAddStaff =
    isAdminRole ||
    dbUser.canManageUsers ||
    (await hasPermission({ id: dbUser.id, role: dbUser.role }, "staff", "add"));

  if (!canAddStaff) return res.status(403).json({ error: "Forbidden" });

  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  // Non-admin staff.add grantees can create regular staff but not other admins —
  // otherwise granting "staff:add" would be an unintended privilege-escalation path.
  if (!isAdminRole && ["SUPER_ADMIN", "ADMIN"].includes(parsed.data.role)) {
    return res.status(403).json({ error: "Admin darajasidagi hodim yarata olmaysiz" });
  }

  const { password, email, ...rest } = parsed.data;

  const existing = await db.user.findUnique({ where: { username: rest.username } });
  if (existing) return res.status(409).json({ error: "Bu username band" });

  const passwordHash = await bcrypt.hash(password, 12);

  const newUser = await db.user.create({
    data: { ...rest, email: email || null, passwordHash },
    select: { id: true, fullName: true, username: true, email: true, role: true, isActive: true },
  });

  res.status(201).json(newUser);
}));

// PATCH /api/users/:id
router.patch("/:id", ah(async (req, res) => {
  const currentUser = req.user;
  const { id } = req.params;
  const isAdmin = ["SUPER_ADMIN", "ADMIN"].includes(currentUser.role);
  const isSelf = currentUser.id === id;

  if (!isAdmin && !isSelf) {
    const canManageStaff = currentUser.canManageUsers || await hasPermission(currentUser, "staff", "edit");
    if (!canManageStaff) return res.status(403).json({ error: "Forbidden" });
    // A permission-granted (non-admin) staff editor can't touch an existing admin account.
    const target = await db.user.findUnique({ where: { id }, select: { role: true } });
    if (!target) return res.status(404).json({ error: "Not found" });
    if (["SUPER_ADMIN", "ADMIN"].includes(target.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
  }

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const {
    password, oldPassword, email, avatarUrl, role, isActive,
    canManageLeads, canManageCourses, canManageUsers, canViewReports, canExportData,
    canSeePayments, canManagePayments, canSeeStudentContacts, canManageAttendance,
    canManageGrades, canSeeReports, canManageExpenses,
    birthDate, ...rest
  } = parsed.data;

  const updateData = { ...rest };
  if (email !== undefined) updateData.email = email || null;
  if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl || null;
  if (birthDate !== undefined) updateData.birthDate = birthDate ? new Date(birthDate) : null;

  // Only admins may change role, active status, and permissions
  if (isAdmin) {
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (canManageLeads !== undefined) updateData.canManageLeads = canManageLeads;
    if (canManageCourses !== undefined) updateData.canManageCourses = canManageCourses;
    if (canManageUsers !== undefined) updateData.canManageUsers = canManageUsers;
    if (canViewReports !== undefined) updateData.canViewReports = canViewReports;
    if (canExportData !== undefined) updateData.canExportData = canExportData;
    if (canSeePayments !== undefined) updateData.canSeePayments = canSeePayments;
    if (canManagePayments !== undefined) updateData.canManagePayments = canManagePayments;
    if (canSeeStudentContacts !== undefined) updateData.canSeeStudentContacts = canSeeStudentContacts;
    if (canManageAttendance !== undefined) updateData.canManageAttendance = canManageAttendance;
    if (canManageGrades !== undefined) updateData.canManageGrades = canManageGrades;
    if (canSeeReports !== undefined) updateData.canSeeReports = canSeeReports;
    if (canManageExpenses !== undefined) updateData.canManageExpenses = canManageExpenses;
  }

  if (password) {
    // Self-service password change requires verifying the current password
    if (isSelf) {
      if (!oldPassword) return res.status(400).json({ error: "Eski parolni kiriting" });
      const existing = await db.user.findUnique({ where: { id }, select: { passwordHash: true } });
      if (!existing || !(await bcrypt.compare(oldPassword, existing.passwordHash))) {
        return res.status(400).json({ error: "Eski parol noto'g'ri" });
      }
    }
    updateData.passwordHash = await bcrypt.hash(password, 12);
  }

  const updated = await db.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true, fullName: true, username: true, email: true, avatarUrl: true, role: true, isActive: true,
      canManageLeads: true, canManageCourses: true, canManageUsers: true,
      canViewReports: true, canExportData: true,
      canSeePayments: true, canManagePayments: true, canSeeStudentContacts: true,
      canManageAttendance: true, canManageGrades: true, canSeeReports: true,
      canManageExpenses: true,
    },
  });

  res.json(updated);
}));

// DELETE /api/users/:id
router.delete("/:id", ah(async (req, res) => {
  const currentUser = req.user;
  if (currentUser.role !== "SUPER_ADMIN") return res.status(403).json({ error: "Forbidden" });

  const { id } = req.params;
  if (id === currentUser.id) return res.status(400).json({ error: "O'zingizni o'chira olmaysiz" });

  await db.user.delete({ where: { id } });
  res.json({ success: true });
}));

export default router;
