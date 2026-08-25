import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Bu route har doim Node.js runtime'da ishlaydi (middleware/edge emas), shuning uchun
// bu yerda Prisma'dan bemalol foydalanish mumkin. Admin birovning rolini yoki
// ruxsatlarini o'zgartirganda, o'sha foydalanuvchi qayta login qilmasdan ham yangi
// huquqlarini olishi uchun frontend shu route'ni davriy tekshiradi.
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Talaba (Lead asosidagi) sessiyalarda id — User emas, Lead id, shuning uchun bu yerni
  // o'tkazib yuboramiz — talabaning roli/ruxsati o'zgarmaydi.
  if (session.user.accountType === "student") {
    return NextResponse.json({ skip: true });
  }

  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true, isActive: true,
      canManageLeads: true, canManageCourses: true, canManageUsers: true,
      canViewReports: true, canExportData: true,
      canSeePayments: true, canManagePayments: true, canSeeStudentContacts: true,
      canManageAttendance: true, canManageGrades: true, canSeeReports: true,
      canManageExpenses: true,
    },
  });

  if (!dbUser || !dbUser.isActive) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(dbUser);
}
