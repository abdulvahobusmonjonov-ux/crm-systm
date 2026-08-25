import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { STAFF_WORK_START, STAFF_LATE_GRACE_MINUTES } from "@/lib/constants";

export const dynamic = "force-dynamic";

function toDate(s: string) {
  return new Date(s + "T00:00:00.000Z");
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Given a Date and today's date-string, decide "ontime" vs "late" against STAFF_WORK_START (+ grace minutes).
function computeStatus(checkIn: Date): "ontime" | "late" {
  const [h, m] = STAFF_WORK_START.split(":").map(Number);
  const deadline = new Date(checkIn);
  deadline.setHours(h, m + STAFF_LATE_GRACE_MINUTES, 0, 0);
  return checkIn.getTime() <= deadline.getTime() ? "ontime" : "late";
}

// GET ?date=YYYY-MM-DD -> all active users + their StaffAttendance record for that date
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || todayStr();
  const d = toDate(date);

  const [users, records] = await Promise.all([
    db.user.findMany({
      where: { isActive: true },
      select: { id: true, fullName: true, role: true, subject: true, avatarUrl: true, groupsTeaching: { select: { id: true } } },
      orderBy: { fullName: "asc" },
    }),
    db.staffAttendance.findMany({ where: { date: d } }),
  ]);

  const map: Record<string, (typeof records)[number]> = {};
  records.forEach((r) => (map[r.userId] = r));

  const staff = users.map((u) => {
    const r = map[u.id];
    return {
      id: u.id,
      fullName: u.fullName,
      role: u.role,
      subject: u.subject || "",
      avatarUrl: u.avatarUrl,
      isTeacher: !!u.subject || u.groupsTeaching.length > 0,
      checkIn: r?.checkIn ?? null,
      checkOut: r?.checkOut ?? null,
      status: r?.status ?? "absent",
    };
  });

  return NextResponse.json({ date, staff });
}

const checkInSchema = z.object({ userId: z.string().min(1), date: z.string().optional() });

// POST { userId, date? } -> check-in (marks ontime/late based on STAFF_WORK_START)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = checkInSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { userId, date } = parsed.data;
  const dateStr = date || todayStr();
  const d = toDate(dateStr);

  const existing = await db.staffAttendance.findUnique({ where: { userId_date: { userId, date: d } } });
  if (existing?.checkIn) {
    return NextResponse.json({ error: "Allaqachon kelgan deb belgilangan" }, { status: 400 });
  }

  const now = new Date();
  const status = computeStatus(now);

  const record = await db.staffAttendance.upsert({
    where: { userId_date: { userId, date: d } },
    update: { checkIn: now, status },
    create: { userId, date: d, checkIn: now, status },
  });

  return NextResponse.json({ success: true, record });
}

const checkOutSchema = z.object({ userId: z.string().min(1), date: z.string().optional() });

// PATCH { userId, date? } -> check-out
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = checkOutSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { userId, date } = parsed.data;
  const dateStr = date || todayStr();
  const d = toDate(dateStr);

  const existing = await db.staffAttendance.findUnique({ where: { userId_date: { userId, date: d } } });
  if (!existing?.checkIn) {
    return NextResponse.json({ error: "Avval kelganini belgilang" }, { status: 400 });
  }
  if (existing.checkOut) {
    return NextResponse.json({ error: "Allaqachon ketgan deb belgilangan" }, { status: 400 });
  }

  const record = await db.staffAttendance.update({
    where: { userId_date: { userId, date: d } },
    data: { checkOut: new Date() },
  });

  return NextResponse.json({ success: true, record });
}
