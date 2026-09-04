import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTeacherGroupIds } from "@/lib/teacher";

async function assertOwnsGroup(userId: string, role: string, groupId: string) {
  if (role === "SUPER_ADMIN" || role === "ADMIN") return true;
  const groupIds = await getTeacherGroupIds(userId);
  return groupIds.includes(groupId);
}

// GET -> [{ id, leadId, leadName, channel, text, sentBy, createdAt }] — every SMS/Telegram
// message logged for this group's students, newest first.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: groupId } = await params;
  if (!(await assertOwnsGroup(session.user.id, session.user.role, groupId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const leads = await db.lead.findMany({ where: { groupId, isArchived: false }, select: { id: true, fullName: true } });
  const leadMap = new Map(leads.map((l) => [l.id, l.fullName]));
  const leadIds = leads.map((l) => l.id);
  if (leadIds.length === 0) return NextResponse.json([]);

  const activities = await db.activity.findMany({
    where: { leadId: { in: leadIds }, action: { in: ["sms_sent", "telegram_sent"] } },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, leadId: true, action: true, details: true, createdAt: true, user: { select: { fullName: true } } },
  });

  const result = activities.map((a) => ({
    id: a.id,
    leadId: a.leadId,
    leadName: a.leadId ? leadMap.get(a.leadId) || "" : "",
    channel: a.action === "sms_sent" ? "sms" : "telegram",
    text: (a.details as { text?: string } | null)?.text || "",
    sentBy: a.user?.fullName || "",
    createdAt: a.createdAt,
  }));

  return NextResponse.json(result);
}
