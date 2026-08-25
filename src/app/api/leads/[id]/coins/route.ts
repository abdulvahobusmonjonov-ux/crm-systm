import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { canManageGrades, isManager } from "@/lib/permissions";

const schema = z.object({
  amount: z.coerce.number().int(),
  reason: z.string().min(1, "Sabab kiriting"),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user;
  // Coin berish/olish faqat baholarni boshqarish huquqi bor xodimlarga (yoki menejer/adminga) ruxsat etiladi.
  if (!canManageGrades(user) && !isManager(user)) {
    return NextResponse.json({ error: "Bu amal uchun ruxsatingiz yo'q" }, { status: 403 });
  }
  const { id } = await params;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { amount, reason } = parsed.data;
  if (amount === 0) return NextResponse.json({ error: "0 bo'lmasin" }, { status: 400 });

  const lead = await db.lead.update({ where: { id }, data: { coins: { increment: amount } }, select: { coins: true } });
  await db.coinTx.create({ data: { leadId: id, amount, reason: reason.trim(), createdById: user.id } });

  return NextResponse.json({ success: true, coins: lead.coins });
}
