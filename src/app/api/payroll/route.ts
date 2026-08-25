import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import type { Session } from "next-auth";
import { canSeeReports, canManagePayments } from "@/lib/permissions";

export const dynamic = "force-dynamic";

function isAdmin(u: Session["user"]) { return ["SUPER_ADMIN", "ADMIN"].includes(u?.role); }
function currentMonth() {
  const t = new Date(Date.now() + 5 * 3600 * 1000);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session.user) && !canSeeReports(session.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") || currentMonth();

  const records = await db.salaryRecord.findMany({
    where: { month },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, fullName: true, role: true } } },
  });

  const map: Record<string, { userId: string; name: string; role: string; salary: number; bonus: number; total: number }> = {};
  for (const r of records) {
    const id = r.userId;
    map[id] ||= { userId: id, name: r.user?.fullName || "—", role: r.user?.role || "", salary: 0, bonus: 0, total: 0 };
    const amt = Number(r.amount || 0);
    if (r.type === "bonus") map[id].bonus += amt; else map[id].salary += amt;
    map[id].total += amt;
  }
  const byUser = Object.values(map).sort((a, b) => b.total - a.total);
  const total = byUser.reduce((a, u) => a + u.total, 0);

  return NextResponse.json({ month, records, byUser, total });
}

const schema = z.object({
  userId: z.string().min(1, "Xodimni tanlang"),
  amount: z.coerce.number().positive("Summa noto'g'ri"),
  month: z.string().min(7),
  type: z.enum(["salary", "bonus"]).optional(),
  note: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session.user) && !canManagePayments(session.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const user = session.user;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  const record = await db.salaryRecord.create({
    data: {
      userId: d.userId,
      amount: d.amount,
      month: d.month,
      type: d.type || "salary",
      note: d.note || null,
      createdById: user.id,
    },
  });
  return NextResponse.json(record, { status: 201 });
}
