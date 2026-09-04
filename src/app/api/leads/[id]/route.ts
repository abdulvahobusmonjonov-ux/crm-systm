import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import type { Prisma } from "@/generated/prisma/client";
import { hasPermission } from "@/lib/rbac";

const updateSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().min(9).optional(),
  phoneSecondary: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  age: z.coerce.number().int().optional().nullable(),
  address: z.string().optional().nullable(),
  parentName: z.string().optional().nullable(),
  parentPhone: z.string().optional().nullable(),
  courseId: z.string().optional().nullable(),
  timeSlotId: z.string().optional().nullable(),
  timePreference: z.enum(["MORNING","AFTERNOON","EVENING","FLEXIBLE"]).optional(),
  preferredDays: z.string().optional().nullable(),
  lessonTime: z.string().optional().nullable(),
  stageId: z.string().optional().nullable(),
  groupId: z.string().optional().nullable(),
  status: z.enum(["NEW","CONTACTED","INTERESTED","TRIAL_BOOKED","TRIAL_COMPLETED","ENROLLED","POSTPONED","LOST"]).optional(),
  source: z.enum(["INSTAGRAM","TELEGRAM","FACEBOOK","TIKTOK","REFERRAL","WEBSITE","WALK_IN","PHONE_CALL","OTHER"]).optional(),
  sourceDetails: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  trialDate: z.string().optional().nullable(),
  enrolledAt: z.string().optional().nullable(),
  lastContactedAt: z.string().optional().nullable(),
  isPinned: z.boolean().optional(),
  frozenAt: z.string().optional().nullable(),
  frozenUntil: z.string().optional().nullable(),
  isArchived: z.boolean().optional(),
  loginCode: z.string().min(4).max(20).optional().nullable(),
  tagIds: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      course: true,
      timeSlot: true,
      stage: true,
      group: {
        select: {
          id: true, name: true, days: true, timeFrom: true, timeTo: true, room: true, startDate: true,
          teacher: { select: { id: true, fullName: true } },
        },
      },
      assignedTo: { select: { id: true, fullName: true, username: true } },
      createdBy: { select: { id: true, fullName: true } },
      tags: true,
      payments: { orderBy: { paidAt: "desc" }, take: 50, include: { createdBy: { select: { fullName: true } } } },
      attendances: { select: { status: true } },
      scores: { orderBy: { createdAt: "desc" }, take: 50, include: { exam: { select: { title: true, maxScore: true } } } },
      reminders: { orderBy: { remindAt: "asc" }, include: { user: { select: { fullName: true } } } },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { user: { select: { id: true, fullName: true } } },
      },
    },
  });

  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(lead);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const user = session.user;
  const isAdminRole = ["SUPER_ADMIN", "ADMIN"].includes(user.role);
  const canEdit = isAdminRole || user.canManageLeads || await hasPermission(user, "leads", "edit");
  if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (parsed.data.isArchived !== undefined) {
    const action = parsed.data.isArchived ? "archive_delete" : "archive_restore";
    const canArchive = isAdminRole || await hasPermission(user, "debtors_archive", action);
    if (!canArchive) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const current = await db.lead.findUnique({ where: { id }, select: { status: true, stageId: true, assignedToId: true } });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { trialDate, enrolledAt, lastContactedAt, frozenAt, frozenUntil, tagIds, ...rest } = parsed.data;
  const updateData: Prisma.LeadUpdateInput = { ...rest };
  if (trialDate !== undefined) updateData.trialDate = trialDate ? new Date(trialDate) : null;
  if (enrolledAt !== undefined) updateData.enrolledAt = enrolledAt ? new Date(enrolledAt) : null;
  if (lastContactedAt !== undefined) updateData.lastContactedAt = lastContactedAt ? new Date(lastContactedAt) : null;
  if (frozenAt !== undefined) updateData.frozenAt = frozenAt ? new Date(frozenAt) : null;
  if (frozenUntil !== undefined) updateData.frozenUntil = frozenUntil ? new Date(frozenUntil) : null;
  // Teglarni to'liq almashtiramiz (checkbox ro'yxatidan tanlangan holat bilan bir xil bo'lsin)
  if (tagIds !== undefined) updateData.tags = { set: tagIds.map((tid) => ({ id: tid })) };

  // Auto-set enrolledAt when status changes to ENROLLED
  if (parsed.data.status === "ENROLLED" && current.status !== "ENROLLED") {
    updateData.enrolledAt = new Date();
  }

  const updated = await db.lead.update({ where: { id }, data: updateData });

  // Log activity
  if (parsed.data.stageId !== undefined && parsed.data.stageId !== current.stageId) {
    const ns = parsed.data.stageId ? await db.stage.findUnique({ where: { id: parsed.data.stageId }, select: { name: true } }) : null;
    await db.activity.create({ data: { leadId: id, userId: user.id, action: "stage_changed", details: { to: ns?.name || "" } } });
  } else if (parsed.data.status && parsed.data.status !== current.status) {
    await db.activity.create({ data: { leadId: id, userId: user.id, action: "status_changed", details: { from: current.status, to: parsed.data.status } } });
  } else {
    await db.activity.create({ data: { leadId: id, userId: user.id, action: "lead_updated" } });
  }

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user;
  if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await db.lead.delete({ where: { id } });
  await logAudit(user.id, user.name || user.fullName, "lead_deleted", "Lead", id);
  return NextResponse.json({ success: true });
}
