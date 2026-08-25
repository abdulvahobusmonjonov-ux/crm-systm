import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db } from "./db.js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d";

const USER_SELECT = {
  id: true, fullName: true, username: true, email: true, phone: true, avatarUrl: true,
  passwordHash: true, role: true, isActive: true,
  canManageLeads: true, canManageCourses: true, canManageUsers: true,
  canViewReports: true, canExportData: true,
  canSeePayments: true, canManagePayments: true, canSeeStudentContacts: true,
  canManageAttendance: true, canManageGrades: true, canSeeReports: true,
  canManageExpenses: true,
};

// The login field accepts either a username or a phone number — anything made up of
// only digits/phone punctuation (with enough digits to be a number) is a phone;
// anything else (letters present, e.g. "admin") is a username.
function isPhoneLike(identifier) {
  const digits = identifier.replace(/\D/g, "");
  return /^[+\d\s()-]+$/.test(identifier.trim()) && digits.length >= 7;
}

// Stored phone numbers aren't guaranteed to share one exact format (with/without
// "998", spaces, "+"), so compare by the last 9 digits (the Uzbek national number).
function phoneSuffix(identifier) {
  const digits = identifier.replace(/\D/g, "");
  return digits.length > 9 ? digits.slice(-9) : digits;
}

function signToken(user) {
  const { passwordHash, ...payload } = user;
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// login(identifier, password) -> { token, user } on success, or null on bad
// credentials / inactive account. identifier is a username or a phone number.
export async function login(identifier, password) {
  if (!identifier || !password) return null;

  const user = isPhoneLike(identifier)
    ? await db.user.findFirst({ where: { phone: { endsWith: phoneSuffix(identifier) } }, select: USER_SELECT })
    : await db.user.findUnique({ where: { username: identifier }, select: USER_SELECT });

  if (!user || !user.isActive) return null;

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) return null;

  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const teachingGroupsCount = await db.group.count({
    where: { teacherId: user.id, isArchived: false },
  });

  const { passwordHash, ...safeUser } = user;
  const fullUser = { ...safeUser, isTeacher: teachingGroupsCount > 0 };

  return { token: signToken(user), user: fullUser };
}

// Express middleware: validates `Authorization: Bearer <token>` and sets req.user
// to the decoded JWT payload (same shape as login()'s `user`, minus passwordHash).
export function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
