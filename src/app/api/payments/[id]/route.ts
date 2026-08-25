import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const payment = await db.payment.findUnique({
    where: { id },
    include: {
      lead: { select: { fullName: true, phone: true, course: { select: { name: true } } } },
      group: { select: { name: true } },
      createdBy: { select: { fullName: true } },
    },
  });
  if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ...payment, courseName: payment.lead?.course?.name || null });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  await db.payment.delete({ where: { id } });
  const u = session.user;
  await logAudit(u.id, u.name || u.fullName, "payment_deleted", "Payment", id);
  return NextResponse.json({ success: true });
}
