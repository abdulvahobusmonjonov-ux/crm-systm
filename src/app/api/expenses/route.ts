import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import type { Session } from "next-auth";
import { canManageExpenses } from "@/lib/permissions";

export const dynamic = "force-dynamic";

function isAdmin(u: Session["user"]) { return ["SUPER_ADMIN", "ADMIN"].includes(u?.role); }
function canAccess(u: Session["user"]) { return isAdmin(u) || canManageExpenses(u); }

// month "YYYY-MM" -> [start, end) in UTC accounting for Tashkent (+5)
function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const TZ = 5 * 3600 * 1000;
  const start = new Date(Date.UTC(y, m - 1, 1) - TZ);
  const end = new Date(Date.UTC(y, m, 1) - TZ);
  return { start, end };
}
function currentMonth() {
  const t = new Date(Date.now() + 5 * 3600 * 1000);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(session.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") || currentMonth();
  const { start, end } = monthRange(month);

  const expenses = await db.expense.findMany({
    where: { spentAt: { gte: start, lt: end } },
    orderBy: { spentAt: "desc" },
    include: { createdBy: { select: { fullName: true } } },
  });
  const total = expenses.reduce((a, e) => a + Number(e.amount || 0), 0);

  return NextResponse.json({ expenses, summary: { month, total, count: expenses.length } });
}

const schema = z.object({
  amount: z.coerce.number().positive("Summa noto'g'ri"),
  category: z.string().min(1, "Kategoriya kiriting"),
  note: z.string().optional().nullable(),
  spentAt: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(session.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const user = session.user;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  const expense = await db.expense.create({
    data: {
      amount: d.amount,
      category: d.category.trim(),
      note: d.note || null,
      spentAt: d.spentAt ? new Date(d.spentAt) : new Date(),
      createdById: user.id,
    },
  });
  return NextResponse.json(expense, { status: 201 });
}
