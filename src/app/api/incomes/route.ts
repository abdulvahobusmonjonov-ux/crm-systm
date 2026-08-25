import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import type { Session } from "next-auth";

export const dynamic = "force-dynamic";

function isAdmin(u: Session["user"]) { return ["SUPER_ADMIN", "ADMIN"].includes(u?.role); }

function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const TZ = 5 * 3600 * 1000;
  return { start: new Date(Date.UTC(y, m - 1, 1) - TZ), end: new Date(Date.UTC(y, m, 1) - TZ) };
}
function currentMonth() {
  const t = new Date(Date.now() + 5 * 3600 * 1000);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") || currentMonth();
  const { start, end } = monthRange(month);

  const incomes = await db.income.findMany({
    where: { receivedAt: { gte: start, lt: end } },
    orderBy: { receivedAt: "desc" },
    include: { createdBy: { select: { fullName: true } } },
  });
  const total = incomes.reduce((a, e) => a + Number(e.amount || 0), 0);

  return NextResponse.json({ incomes, summary: { month, total, count: incomes.length } });
}

const schema = z.object({
  amount: z.coerce.number().positive("Summa noto'g'ri"),
  source: z.string().min(1, "Manba kiriting"),
  note: z.string().optional().nullable(),
  receivedAt: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const user = session.user;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  const income = await db.income.create({
    data: {
      amount: d.amount,
      source: d.source.trim(),
      note: d.note || null,
      receivedAt: d.receivedAt ? new Date(d.receivedAt) : new Date(),
      createdById: user.id,
    },
  });
  return NextResponse.json(income, { status: 201 });
}
