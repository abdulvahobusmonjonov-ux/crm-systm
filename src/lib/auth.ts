import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "./auth.config";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});
  
const studentLoginSchema = z.object({
  phone: z.string().min(1),
  code: z.string().min(1),
});

// The "username" field on the login form now accepts either a real username or a phone
// number — this decides which column to look the identifier up by. Anything made up of
// only digits/phone punctuation (with enough digits to be a number) is treated as a phone;
// anything else (letters present, e.g. "admin") is treated as a username.
function isPhoneLike(identifier: string): boolean {
  const digits = identifier.replace(/\D/g, "");
  return /^[+\d\s()-]+$/.test(identifier.trim()) && digits.length >= 7;
}

// Stored phone numbers aren't guaranteed to share one exact format (with/without "998",
// spaces, "+"), so compare by the last 9 digits (the Uzbek national number) instead of
// requiring an exact string match.
function phoneSuffix(identifier: string): string {
  const digits = identifier.replace(/\D/g, "");
  return digits.length > 9 ? digits.slice(-9) : digits;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { username: identifier, password } = parsed.data;

        const select = {
          id: true, fullName: true, username: true, email: true, avatarUrl: true,
          passwordHash: true, role: true, isActive: true,
          canManageLeads: true, canManageCourses: true,
          canManageUsers: true, canViewReports: true, canExportData: true,
          canSeePayments: true, canManagePayments: true, canSeeStudentContacts: true,
          canManageAttendance: true, canManageGrades: true, canSeeReports: true,
          canManageExpenses: true,
        } as const;

        const user = isPhoneLike(identifier)
          ? await db.user.findFirst({ where: { phone: { endsWith: phoneSuffix(identifier) } }, select })
          : await db.user.findUnique({ where: { username: identifier }, select });

        if (!user || !user.isActive) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        const teachingGroupsCount = await db.group.count({
          where: { teacherId: user.id, isArchived: false },
        });

        return {
          id: user.id,
          name: user.fullName,
          email: user.email,
          role: user.role,
          username: user.username,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl,
          canManageLeads: user.canManageLeads,
          canManageCourses: user.canManageCourses,
          canManageUsers: user.canManageUsers,
          canViewReports: user.canViewReports,
          canExportData: user.canExportData,
          canSeePayments: user.canSeePayments,
          canManagePayments: user.canManagePayments,
          canSeeStudentContacts: user.canSeeStudentContacts,
          canManageAttendance: user.canManageAttendance,
          canManageGrades: user.canManageGrades,
          canSeeReports: user.canSeeReports,
          canManageExpenses: user.canManageExpenses,
          isTeacher: teachingGroupsCount > 0,
          accountType: "staff",
        };
      },
    }),
    Credentials({
      id: "student",
      name: "student",
      credentials: {
        phone: { label: "Telefon", type: "text" },
        code: { label: "Kod", type: "text" },
      },
      async authorize(credentials) {
        const parsed = studentLoginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { phone, code } = parsed.data;
        const lead = await db.lead.findFirst({
          where: { phone: { endsWith: phoneSuffix(phone) }, isArchived: false, loginCode: { not: null } },
          select: { id: true, fullName: true, phone: true, loginCode: true },
        });
        if (!lead || !lead.loginCode || lead.loginCode !== code) return null;

        return {
          id: lead.id,
          name: lead.fullName,
          email: null,
          role: "STUDENT",
          username: lead.phone,
          fullName: lead.fullName,
          avatarUrl: null,
          canManageLeads: false,
          canManageCourses: false,
          canManageUsers: false,
          canViewReports: false,
          canExportData: false,
          canSeePayments: false,
          canManagePayments: false,
          canSeeStudentContacts: false,
          canManageAttendance: false,
          canManageGrades: false,
          canSeeReports: false,
          canManageExpenses: false,
          isTeacher: false,
          accountType: "student",
        };
      },
    }),
  ],
});
