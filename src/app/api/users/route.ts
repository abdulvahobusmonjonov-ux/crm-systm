import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { hasPermission } from "@/lib/rbac";

const createUserSchema = z.object({
  fullName: z.string().min(2, "Ism kamida 2 harf"),
  username: z
    .string()
    .min(3, "Username kamida 3 harf")
    .regex(/^[a-z0-9_]+$/, "Faqat kichik harf, raqam va _"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  password: z.string().min(8, "Parol kamida 8 ta belgi"),

  role: z.enum([
    "SUPER_ADMIN",
    "ADMIN",
    "MANAGER",
    "OPERATOR",
    "MENTOR",
    "RECEPTION",
    "ACCOUNTANT",
  ]),

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

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const currentUser = session.user;

  const isAdminRole =
    currentUser.role === "SUPER_ADMIN" ||
    currentUser.role === "ADMIN";

  const canSeeFullList =
    isAdminRole || currentUser.canManageUsers;

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },

    select: canSeeFullList
      ? {
          id: true,
          fullName: true,
          username: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          avatarUrl: true,
          createdAt: true,
          lastLoginAt: true,

          canManageLeads: true,
          canManageCourses: true,
          canManageUsers: true,
          canViewReports: true,
          canExportData: true,

          canSeePayments: true,
          canManagePayments: true,
          canSeeStudentContacts: true,
          canManageAttendance: true,
          canManageGrades: true,
          canSeeReports: true,
          canManageExpenses: true,

          _count: {
            select: {
              leads: true,
            },
          },
        }
      : {
          id: true,
          fullName: true,
          role: true,
          isActive: true,
          avatarUrl: true,
        },
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  // ------------------------------------------------------------
  // 1. Sessionni tekshiramiz
  // ------------------------------------------------------------

  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const sessionUser = session.user;

  // ------------------------------------------------------------
  // 2. MUHIM:
  // Role va permissionni faqat JWT/sessiondan olmaymiz.
  //
  // Sessiondagi role eski bo'lib qolishi mumkin.
  // Shuning uchun haqiqiy userni DB'dan olamiz.
  // ------------------------------------------------------------

  const dbUser = await db.user.findUnique({
    where: {
      id: sessionUser.id,
    },

    select: {
      id: true,
      role: true,
      canManageUsers: true,
    },
  });

  if (!dbUser) {
    return NextResponse.json(
      { error: "Foydalanuvchi topilmadi" },
      { status: 404 }
    );
  }

  // ------------------------------------------------------------
  // 3. Haqiqiy DB role orqali adminni aniqlaymiz
  // ------------------------------------------------------------

  const isAdminRole =
    dbUser.role === "SUPER_ADMIN" ||
    dbUser.role === "ADMIN";

  // ------------------------------------------------------------
  // 4. Teacher/staff qo'shishga ruxsat
  //
  // SUPER_ADMIN va ADMIN avtomatik ruxsatga ega.
  // canManageUsers bo'lsa ham ruxsat.
  // Qolganlar uchun staff:add permission tekshiriladi.
  // ------------------------------------------------------------

  const canAddStaff =
    isAdminRole ||
    dbUser.canManageUsers ||
    (await hasPermission(
      {
        id: dbUser.id,
        role: dbUser.role,
      },
      "staff",
      "add"
    ));

  if (!canAddStaff) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  // ------------------------------------------------------------
  // 5. Formadan kelgan ma'lumotlarni tekshiramiz
  // ------------------------------------------------------------

  const body = await req.json();

  const parsed = createUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  // ------------------------------------------------------------
  // 6. Admin bo'lmagan odam boshqa admin yarata olmaydi
  // ------------------------------------------------------------

  if (
    !isAdminRole &&
    ["SUPER_ADMIN", "ADMIN"].includes(parsed.data.role)
  ) {
    return NextResponse.json(
      {
        error:
          "Admin darajasidagi hodim yarata olmaysiz",
      },
      { status: 403 }
    );
  }

  // ------------------------------------------------------------
  // 7. Passwordni ajratib olamiz
  // ------------------------------------------------------------

  const {
    password,
    email,
    ...rest
  } = parsed.data;

  // ------------------------------------------------------------
  // 8. Username bandligini tekshiramiz
  // ------------------------------------------------------------

  const existing = await db.user.findUnique({
    where: {
      username: rest.username,
    },
  });

  if (existing) {
    return NextResponse.json(
      {
        error: "Bu username band",
      },
      { status: 409 }
    );
  }

  // ------------------------------------------------------------
  // 9. Passwordni hash qilamiz
  // ------------------------------------------------------------

  const passwordHash = await bcrypt.hash(
    password,
    12
  );

  // ------------------------------------------------------------
  // 10. Yangi user yaratamiz
  // ------------------------------------------------------------

  const newUser = await db.user.create({
    data: {
      ...rest,

      email: email || null,

      passwordHash,
    },

    select: {
      id: true,
      fullName: true,
      username: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  // ------------------------------------------------------------
  // 11. Natijani qaytaramiz
  // ------------------------------------------------------------

  return NextResponse.json(
    newUser,
    {
      status: 201,
    }
  );
}