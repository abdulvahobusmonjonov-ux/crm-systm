import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import type { Prisma } from "@/generated/prisma/client";

const createSchema = z.object({
  leadId: z.string().min(1, "O'quvchi tanlang"),
  amount: z.coerce.number().positive("Summa noto'g'ri"),
  discount: z.coerce.number().min(0).optional().nullable(),
  method: z.string().optional(),
  type: z.string().optional(),
  forMonth: z.string().optional().nullable(),
  groupId: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  paidAt: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get("leadId");
  const groupId = searchParams.get("groupId");
  const month = searchParams.get("month"); // YYYY-MM
  const q = searchParams.get("q");

  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  const where: Prisma.PaymentWhereInput = {};
  if (leadId) where.leadId = leadId;
  if (groupId) where.groupId = groupId;
  if (month) where.forMonth = month;
  if (q) where.lead = { OR: [{ fullName: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] };

  const now = new Date();
  const tz = 5 * 3600 * 1000;
  const t = new Date(now.getTime() + tz);
  const monthStr = `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}`;

  const [payments, total, allAgg, monthAgg] = await Promise.all([
    db.payment.findMany({
      where,
      orderBy: { paidAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        amount: true,
        discount: true,
        currency: true,
        method: true,
        type: true,
        forMonth: true,
        note: true,
        paidAt: true,
        lead: { select: { id: true, fullName: true, phone: true } },
        group: { select: { id: true, name: true } },
        createdBy: { select: { id: true, fullName: true } },
      },
    }),
    db.payment.count({ where }),
    db.payment.aggregate({ _sum: { amount: true }, _count: true, where }),
    db.payment.aggregate({ _sum: { amount: true }, where: { ...where, forMonth: month || monthStr } }),
  ]);

  return NextResponse.json({
    payments,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
    summary: {
      total: Number(allAgg._sum.amount || 0),
      count: allAgg._count,
      monthTotal: Number(monthAgg._sum.amount || 0),
      month: month || monthStr,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  const payment = await db.payment.create({
    data: {
      leadId: d.leadId,
      amount: d.amount,
      discount: d.discount ?? null,
      method: d.method || "cash",
      type: d.type || "tuition",
      forMonth: d.forMonth || null,
      groupId: d.groupId || null,
      note: d.note || null,
      paidAt: d.paidAt ? new Date(d.paidAt) : new Date(),
      createdById: user.id,
    },
    include: { lead: { select: { id: true, fullName: true } } },
  });

  await db.activity.create({
    data: { leadId: d.leadId, userId: user.id, action: "payment", details: { amount: d.amount, forMonth: d.forMonth } },
  });
  await logAudit(user.id, user.name || user.fullName, "payment_created", "Payment", payment.id, { amount: d.amount });

  return NextResponse.json(payment, { status: 201 });
}
