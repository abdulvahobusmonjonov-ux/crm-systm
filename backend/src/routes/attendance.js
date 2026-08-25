import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/db.js";
import { ah } from "../lib/http.js";
import { hasPermission } from "../lib/rbac.js";

const router = Router();

function toDate(s) {
  return new Date(s + "T00:00:00.000Z");
}

const saveSchema = z.object({
  groupId: z.string().min(1),
  date: z.string().min(1),
  records: z.array(z.object({ leadId: z.string(), status: z.string(), note: z.string().optional().nullable() })),
});

// GET ?groupId=&month=YYYY-MM  -> monthly journal: { students, journal: { [date]: { [leadId]: status } } }
// GET ?groupId=&date=YYYY-MM-DD -> students + their status for that single date
router.get("/", ah(async (req, res) => {
  const groupId = req.query.groupId;
  if (!groupId) return res.status(400).json({ error: "groupId kerak" });

  const month = req.query.month;
  if (month) {
    const [yr, mn] = String(month).split("-").map(Number);
    const from = new Date(`${month}-01T00:00:00.000Z`);
    const to = new Date(Date.UTC(yr, mn, 0, 23, 59, 59, 999));
    const [students, records] = await Promise.all([
      db.lead.findMany({ where: { groupId }, select: { id: true, fullName: true, phone: true }, orderBy: { fullName: "asc" } }),
      db.attendance.findMany({ where: { groupId, date: { gte: from, lte: to } } }),
    ]);
    const journal = {};
    for (const r of records) {
      const key = r.date.toISOString().slice(0, 10);
      if (!journal[key]) journal[key] = {};
      journal[key][r.leadId] = r.status;
    }
    // Same student shape as the single-date branch below — the client keys
    // rows and journal lookups off `leadId`, not `id`.
    return res.json({
      month,
      students: students.map((s) => ({ leadId: s.id, fullName: s.fullName, phone: s.phone, status: null })),
      journal,
    });
  }

  const date = req.query.date;
  if (!date) return res.status(400).json({ error: "date yoki month kerak" });

  const [students, att] = await Promise.all([
    db.lead.findMany({ where: { groupId }, select: { id: true, fullName: true, phone: true }, orderBy: { fullName: "asc" } }),
    db.attendance.findMany({ where: { groupId, date: toDate(String(date)) } }),
  ]);
  const map = {};
  att.forEach((a) => (map[a.leadId] = a.status));

  res.json({
    date,
    students: students.map((s) => ({ leadId: s.id, fullName: s.fullName, phone: s.phone, status: map[s.id] || null })),
  });
}));

// POST bulk save attendance for a group+date
router.post("/", ah(async (req, res) => {
  const user = req.user;
  const isAdminRole = ["SUPER_ADMIN", "ADMIN"].includes(user.role);
  const canMark = isAdminRole || user.canManageAttendance || await hasPermission(user, "attendance", "mark");
  if (!canMark) return res.status(403).json({ error: "Forbidden" });

  const parsed = saveSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { groupId, date, records } = parsed.data;
  const d = toDate(date);

  for (const r of records) {
    await db.attendance.upsert({
      where: { groupId_leadId_date: { groupId, leadId: r.leadId, date: d } },
      update: { status: r.status, note: r.note || null },
      create: { groupId, leadId: r.leadId, date: d, status: r.status, note: r.note || null, createdById: user.id },
    });
  }

  res.json({ success: true, saved: records.length });
}));

export default router;
