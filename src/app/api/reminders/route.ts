import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { startOfDay, endOfDay, addDays } from "date-fns";
import { Prisma, type ReminderStatus } from "@/generated/prisma/client";

const createSchema = z.object({
  leadId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  remindAt: z.string(),
  notifyBrowser: z.boolean().default(true),
  notifyTelegram: z.boolean().default(false),
  notifyEmail: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "";
  const limit = parseInt(searchParams.get("limit") || "50");

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekEnd = endOfDay(addDays(now, 7));

  const where: Prisma.ReminderWhereInput = { userId: user.id };
  if (status) where.status = status as ReminderStatus;

  const [reminders, totalToday] = await Promise.all([
    db.reminder.findMany({
      where,
      orderBy: { remindAt: "asc" },
      take: limit,
      include: {
        lead: { select: { id: true, fullName: true, phone: true } },
        user: { select: { fullName: true } },
      },
    }),
    // Counts for bell badge
    db.reminder.count({
      where: { userId: user.id, status: "PENDING", remindAt: { gte: todayStart, lte: todayEnd } },
    }),
  ]);

  const overdue = reminders.filter(r => r.status === "PENDING" && new Date(r.remindAt) < todayStart);
  const today = reminders.filter(r => r.status === "PENDING" && new Date(r.remindAt) >= todayStart && new Date(r.remindAt) <= todayEnd);
  const upcoming = reminders.filter(r => r.status === "PENDING" && new Date(r.remindAt) > todayEnd && new Date(r.remindAt) <= weekEnd);
  const done = reminders.filter(r => r.status === "DONE" || r.status === "CANCELLED" || r.status === "MISSED");

  return NextResponse.json({ reminders, overdue, today, upcoming, done, totalToday });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user;
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const reminder = await db.reminder.create({
    data: { ...parsed.data, remindAt: new Date(parsed.data.remindAt), userId: user.id },
  });

  await db.activity.create({
    data: { leadId: parsed.data.leadId, userId: user.id, action: "reminder_created" },
  });

  return NextResponse.json(reminder, { status: 201 });
}
