import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { db } from "../lib/db.js";
import { ah, qs } from "../lib/http.js";
import { hasPermission } from "../lib/rbac.js";
import { canManageGrades, isManager } from "../lib/permissions.js";
import { logAudit } from "../lib/audit.js";
import { buildLeadsWhere } from "../lib/leads.js";
import { LEAD_STATUS_LABELS, LEAD_SOURCE_LABELS } from "../lib/constants.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const createSchema = z.object({
  fullName: z.string().min(2, "Ism kamida 2 harf"),
  phone: z.string().min(9, "Telefon raqam noto'g'ri"),
  phoneSecondary: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  age: z.coerce.number().int().min(5).max(99).optional().nullable(),
  address: z.string().optional(),
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
  courseId: z.string().optional().nullable(),
  timeSlotId: z.string().optional().nullable(),
  timePreference: z.enum(["MORNING", "AFTERNOON", "EVENING", "FLEXIBLE"]).default("FLEXIBLE"),
  preferredDays: z.string().optional(),
  lessonTime: z.string().optional(),
  stageId: z.string().optional().nullable(),
  status: z.enum(["NEW", "CONTACTED", "INTERESTED", "TRIAL_BOOKED", "TRIAL_COMPLETED", "ENROLLED", "POSTPONED", "LOST"]).default("NEW"),
  source: z.enum(["INSTAGRAM", "TELEGRAM", "FACEBOOK", "TIKTOK", "REFERRAL", "WEBSITE", "WALK_IN", "PHONE_CALL", "OTHER"]).default("OTHER"),
  sourceDetails: z.string().optional(),
  notes: z.string().optional(),
  assignedToId: z.string().optional().nullable(),
  trialDate: z.string().optional().nullable(),
  reminderAt: z.string().optional().nullable(),
  reminderTitle: z.string().optional(),
});

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
  timePreference: z.enum(["MORNING", "AFTERNOON", "EVENING", "FLEXIBLE"]).optional(),
  preferredDays: z.string().optional().nullable(),
  lessonTime: z.string().optional().nullable(),
  stageId: z.string().optional().nullable(),
  groupId: z.string().optional().nullable(),
  status: z.enum(["NEW", "CONTACTED", "INTERESTED", "TRIAL_BOOKED", "TRIAL_COMPLETED", "ENROLLED", "POSTPONED", "LOST"]).optional(),
  source: z.enum(["INSTAGRAM", "TELEGRAM", "FACEBOOK", "TIKTOK", "REFERRAL", "WEBSITE", "WALK_IN", "PHONE_CALL", "OTHER"]).optional(),
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

// GET /api/leads
router.get("/", ah(async (req, res) => {
  const params = qs(req);
  const page = parseInt(params.get("page") || "1");
  const limit = parseInt(params.get("limit") || "50");
  const skip = (page - 1) * limit;

  const where = await buildLeadsWhere(params, req.user);

  const [leads, total] = await Promise.all([
    db.lead.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        status: true,
        source: true,
        createdAt: true,
        lastContactedAt: true,
        enrolledAt: true,
        stageId: true,
        timeSlotId: true,
        preferredDays: true,
        course: { select: { id: true, name: true, color: true } },
        timeSlot: { select: { id: true, label: true } },
        stage: { select: { id: true, name: true, color: true } },
        group: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, fullName: true } },
      },
    }),
    db.lead.count({ where }),
  ]);

  res.json({ leads, total, page, limit, pages: Math.ceil(total / limit) });
}));

// POST /api/leads
router.post("/", ah(async (req, res) => {
  const user = req.user;
  const isAdminRole = ["SUPER_ADMIN", "ADMIN"].includes(user.role);
  const canAdd = isAdminRole || user.canManageLeads || await hasPermission(user, "leads", "add");
  if (!canAdd) return res.status(403).json({ error: "Forbidden" });

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const existing = await db.lead.findFirst({ where: { phone: parsed.data.phone } });
  if (existing) {
    return res.status(409).json({ error: "duplicate", message: "Bu telefon raqam allaqachon mavjud", leadId: existing.id });
  }

  const { reminderAt, reminderTitle, trialDate, age, courseId, timeSlotId, assignedToId, stageId, ...rest } = parsed.data;

  let finalStageId = stageId || null;
  if (!finalStageId) {
    const firstStage = await db.stage.findFirst({ orderBy: { order: "asc" } });
    finalStageId = firstStage?.id ?? null;
  }

  const lead = await db.lead.create({
    data: {
      ...rest,
      age: age ?? null,
      courseId: courseId || null,
      timeSlotId: timeSlotId || null,
      assignedToId: assignedToId || null,
      stageId: finalStageId,
      trialDate: trialDate ? new Date(trialDate) : null,
      createdById: user.id,
    },
  });

  await db.activity.create({
    data: { leadId: lead.id, userId: user.id, action: "lead_created", details: { status: lead.status } },
  });

  if (reminderAt) {
    await db.reminder.create({
      data: {
        leadId: lead.id,
        userId: user.id,
        title: reminderTitle || "Qo'ng'iroq qilish",
        remindAt: new Date(reminderAt),
      },
    });
  }

  res.status(201).json(lead);
}));

// GET /api/leads/export — must be declared before "/:id" so it isn't matched as an id.
router.get("/export", ah(async (req, res) => {
  const where = await buildLeadsWhere(qs(req), req.user);

  const leads = await db.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { course: { select: { name: true } } },
  });

  const data = leads.map((l) => ({
    "F.I.Sh": l.fullName,
    "Telefon": l.phone,
    "Kurs": l.course?.name || "",
    "Holat": LEAD_STATUS_LABELS[l.status] || l.status,
    "Manba": LEAD_SOURCE_LABELS[l.source] || l.source,
    "Sana": format(l.createdAt, "dd.MM.yyyy HH:mm"),
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [{ wch: 24 }, { wch: 16 }, { wch: 22 }, { wch: 18 }, { wch: 16 }, { wch: 16 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Lidlar");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="lidlar_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx"`);
  res.send(buf);
}));

const NAME_KEYS = ["f.i.sh", "fish", "f.i.o", "fio", "ism familya", "ism", "to'liq ism", "toliq ism", "fullname"];
const PHONE_KEYS = ["telefon", "phone", "tel"];

// Any source is accepted except WEBSITE — that value is reserved for leads that came
// through the public landing form, never for a bulk-imported spreadsheet.
const IMPORTABLE_SOURCES = ["INSTAGRAM", "TELEGRAM", "FACEBOOK", "TIKTOK", "REFERRAL", "WALK_IN", "PHONE_CALL", "OTHER"];

function pick(row, keys) {
  for (const [k, v] of Object.entries(row)) {
    if (keys.includes(k.trim().toLowerCase())) return String(v ?? "").trim();
  }
  return "";
}

// POST /api/leads/import (multipart: file + source)
router.post("/import", upload.single("file"), ah(async (req, res) => {
  const user = req.user;
  const isAdminRole = ["SUPER_ADMIN", "ADMIN"].includes(user.role);
  const canAdd = isAdminRole || user.canManageLeads || await hasPermission(user, "leads", "add");
  if (!canAdd) return res.status(403).json({ error: "Forbidden" });

  if (!req.file) return res.status(400).json({ error: "Fayl topilmadi" });

  const requestedSource = String(req.body.source || "OTHER").toUpperCase();
  const source = IMPORTABLE_SOURCES.includes(requestedSource) ? requestedSource : "OTHER";

  let rows;
  try {
    const wb = XLSX.read(req.file.buffer, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
  } catch {
    return res.status(400).json({ error: "Faylni o'qib bo'lmadi. .xlsx formatida yuklang" });
  }

  if (rows.length === 0) return res.status(400).json({ error: "Faylda ma'lumot topilmadi" });

  const existingPhones = new Set(
    (await db.lead.findMany({ select: { phone: true } })).map((l) => l.phone.replace(/\D/g, ""))
  );
  const firstStage = await db.stage.findFirst({ orderBy: { order: "asc" } });

  const errors = [];
  const seenPhones = new Set();
  const toCreate = [];

  rows.forEach((row, i) => {
    const rowNum = i + 2; // +1 for 1-based, +1 for the header row
    const fullName = pick(row, NAME_KEYS);
    const phoneRaw = pick(row, PHONE_KEYS);
    const digits = phoneRaw.replace(/\D/g, "");

    if (!fullName || fullName.length < 2) {
      errors.push({ row: rowNum, reason: "F.I.Sh kiritilmagan yoki juda qisqa" });
      return;
    }
    if (digits.length < 9) {
      errors.push({ row: rowNum, reason: "Telefon raqam noto'g'ri yoki bo'sh" });
      return;
    }
    if (existingPhones.has(digits)) {
      errors.push({ row: rowNum, reason: `Telefon allaqachon mavjud: ${phoneRaw}` });
      return;
    }
    if (seenPhones.has(digits)) {
      errors.push({ row: rowNum, reason: `Faylda takrorlangan telefon: ${phoneRaw}` });
      return;
    }
    seenPhones.add(digits);

    toCreate.push({
      fullName,
      phone: phoneRaw,
      source,
      stageId: firstStage?.id ?? null,
      createdById: user.id,
    });
  });

  if (toCreate.length > 0) {
    await db.lead.createMany({ data: toCreate });
    await logAudit(user.id, user.fullName, "leads_import", "Lead", undefined, {
      created: toCreate.length,
      failed: errors.length,
      source,
    });
  }

  res.json({ total: rows.length, created: toCreate.length, failed: errors.length, errors });
}));

// GET /api/leads/:id
router.get("/:id", ah(async (req, res) => {
  const lead = await db.lead.findUnique({
    where: { id: req.params.id },
    include: {
      course: true,
      timeSlot: true,
      stage: true,
      group: { select: { id: true, name: true, days: true, timeFrom: true, timeTo: true } },
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

  if (!lead) return res.status(404).json({ error: "Not found" });
  res.json(lead);
}));

// PATCH /api/leads/:id
router.patch("/:id", ah(async (req, res) => {
  const { id } = req.params;
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const user = req.user;
  const isAdminRole = ["SUPER_ADMIN", "ADMIN"].includes(user.role);
  const canEdit = isAdminRole || user.canManageLeads || await hasPermission(user, "leads", "edit");
  if (!canEdit) return res.status(403).json({ error: "Forbidden" });

  if (parsed.data.isArchived !== undefined) {
    const action = parsed.data.isArchived ? "archive_delete" : "archive_restore";
    const canArchive = isAdminRole || await hasPermission(user, "debtors_archive", action);
    if (!canArchive) return res.status(403).json({ error: "Forbidden" });
  }

  const current = await db.lead.findUnique({ where: { id }, select: { status: true, stageId: true, assignedToId: true } });
  if (!current) return res.status(404).json({ error: "Not found" });

  const { trialDate, enrolledAt, lastContactedAt, frozenAt, frozenUntil, tagIds, ...rest } = parsed.data;
  const updateData = { ...rest };
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

  if (parsed.data.stageId !== undefined && parsed.data.stageId !== current.stageId) {
    const ns = parsed.data.stageId ? await db.stage.findUnique({ where: { id: parsed.data.stageId }, select: { name: true } }) : null;
    await db.activity.create({ data: { leadId: id, userId: user.id, action: "stage_changed", details: { to: ns?.name || "" } } });
  } else if (parsed.data.status && parsed.data.status !== current.status) {
    await db.activity.create({ data: { leadId: id, userId: user.id, action: "status_changed", details: { from: current.status, to: parsed.data.status } } });
  } else {
    await db.activity.create({ data: { leadId: id, userId: user.id, action: "lead_updated" } });
  }

  res.json(updated);
}));

// DELETE /api/leads/:id
router.delete("/:id", ah(async (req, res) => {
  const user = req.user;
  if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { id } = req.params;
  await db.lead.delete({ where: { id } });
  await logAudit(user.id, user.fullName, "lead_deleted", "Lead", id);
  res.json({ success: true });
}));

// POST /api/leads/:id/activity
router.post("/:id/activity", ah(async (req, res) => {
  const { action, details } = req.body;
  const activity = await db.activity.create({
    data: { leadId: req.params.id, userId: req.user.id, action, details: details || null },
  });
  res.status(201).json(activity);
}));

const coinsSchema = z.object({
  amount: z.coerce.number().int(),
  reason: z.string().min(1, "Sabab kiriting"),
});

// POST /api/leads/:id/coins
router.post("/:id/coins", ah(async (req, res) => {
  const user = req.user;
  // Coin berish/olish faqat baholarni boshqarish huquqi bor xodimlarga (yoki menejer/adminga) ruxsat etiladi.
  if (!canManageGrades(user) && !isManager(user)) {
    return res.status(403).json({ error: "Bu amal uchun ruxsatingiz yo'q" });
  }

  const parsed = coinsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { amount, reason } = parsed.data;
  if (amount === 0) return res.status(400).json({ error: "0 bo'lmasin" });

  const { id } = req.params;
  const lead = await db.lead.update({ where: { id }, data: { coins: { increment: amount } }, select: { coins: true } });
  await db.coinTx.create({ data: { leadId: id, amount, reason: reason.trim(), createdById: user.id } });

  res.json({ success: true, coins: lead.coins });
}));

async function getTelegramToken() {
  const s = await db.setting.findUnique({ where: { key: "telegram_bot_token" } });
  return s?.value || process.env.TELEGRAM_BOT_TOKEN || "";
}

// POST /api/leads/:id/notify
router.post("/:id/notify", ah(async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: "Matn kiriting" });

  const lead = await db.lead.findUnique({ where: { id }, select: { telegramChatId: true, fullName: true } });
  if (!lead?.telegramChatId) return res.status(400).json({ error: "O'quvchi botga ulanmagan" });

  const token = await getTelegramToken();
  if (!token) return res.status(400).json({ error: "Bot token saqlanmagan" });

  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: lead.telegramChatId, text }),
    });
    const data = await r.json();
    if (!data.ok) return res.status(400).json({ error: data.description || "Yuborilmadi" });
    await db.activity.create({ data: { leadId: id, userId: req.user.id, action: "telegram_sent", details: { text } } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
}));

export default router;
