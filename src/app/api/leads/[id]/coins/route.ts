import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { canGradeGroup } from "@/lib/teacher";

const schema = z.object({
  amount: z.coerce.number().int(),
  reason: z.string().min(1, "Sabab kiriting"),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user;
  const { id } = await params;

  // Coin berish/olish faqat shu o'quvchiga tegishli guruh o'qituvchisiga (yoki baholashga
  // aniq ruxsat berilgan xodimga) ruxsat etiladi — admin uchun avtomatik bypass yo'q.
  const lead = await db.lead.findUnique({ where: { id }, select: { groupId: true } });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const allowed = lead.groupId ? await canGradeGroup(user, lead.groupId) : !!user.canManageGrades;
  if (!allowed) {
    return NextResponse.json({ error: "Bu amal uchun ruxsatingiz yo'q" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { amount, reason } = parsed.data;
  if (amount === 0) return NextResponse.json({ error: "0 bo'lmasin" }, { status: 400 });

  const updated = await db.lead.update({ where: { id }, data: { coins: { increment: amount } }, select: { coins: true } });
  await db.coinTx.create({ data: { leadId: id, amount, reason: reason.trim(), createdById: user.id } });

  return NextResponse.json({ success: true, coins: updated.coins });
}
