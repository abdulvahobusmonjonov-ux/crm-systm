import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

// One-off, admin-only staff import. Idempotent: an existing username is left
// completely untouched (including its password), so re-running never resets a
// staff member who has already changed theirs.
const SHARED_PASSWORD = "robo9005";
const BCRYPT_ROUNDS = 12;

const STAFF: { fullName: string; username: string; phone: string }[] = [
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

export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const usernames = STAFF.map((s) => s.username);
  const existing = await db.user.findMany({
    where: { username: { in: usernames } },
    select: { username: true },
  });
  const existingSet = new Set(existing.map((u) => u.username));

  const created: string[] = [];
  const skipped: string[] = [...existingSet];

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

  return NextResponse.json({ ok: true, created: created.length, createdUsernames: created, skipped });
}
