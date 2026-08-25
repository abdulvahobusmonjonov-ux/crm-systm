import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/db.js";
import { ah } from "../lib/http.js";
import { STAFF_WORK_START, STAFF_LATE_GRACE_MINUTES } from "../lib/constants.js";

const router = Router();

function toDate(s) {
  return new Date(s + "T00:00:00.000Z");
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Given a Date, decide "ontime" vs "late" against STAFF_WORK_START (+ grace minutes).
function computeStatus(checkIn) {
  const [h, m] = STAFF_WORK_START.split(":").map(Number);
  const deadline = new Date(checkIn);
  deadline.setHours(h, m + STAFF_LATE_GRACE_MINUTES, 0, 0);
  return checkIn.getTime() <= deadline.getTime() ? "ontime" : "late";
}

const checkInSchema = z.object({ userId: z.string().min(1), date: z.string().optional() });
const checkOutSchema = z.object({ userId: z.string().min(1), date: z.string().optional() });

// GET ?date=YYYY-MM-DD -> all active users + their StaffAttendance record for that date
router.get("/", ah(async (req, res) => {
  const date = req.query.date || todayStr();
  const d = toDate(String(date));

  const [users, records] = await Promise.all([
    db.user.findMany({
      where: { isActive: true },
      select: { id: true, fullName: true, role: true, subject: true, avatarUrl: true, groupsTeaching: { select: { id: true } } },
      orderBy: { fullName: "asc" },
    }),
    db.staffAttendance.findMany({ where: { date: d } }),
  ]);

  const map = {};
  records.forEach((r) => (map[r.userId] = r));

  const staff = users.map((u) => {
    const r = map[u.id];
    return {
      id: u.id,
      fullName: u.fullName,
      role: u.role,
      subject: u.subject || "",
      avatarUrl: u.avatarUrl,
      isTeacher: !!u.subject || u.groupsTeaching.length > 0,
      checkIn: r?.checkIn ?? null,
      checkOut: r?.checkOut ?? null,
      status: r?.status ?? "absent",
    };
  });

  res.json({ date, staff });
}));

// POST { userId, date? } -> check-in (marks ontime/late based on STAFF_WORK_START)
router.post("/", ah(async (req, res) => {
  const parsed = checkInSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { userId, date } = parsed.data;
  const d = toDate(date || todayStr());

  const existing = await db.staffAttendance.findUnique({ where: { userId_date: { userId, date: d } } });
  if (existing?.checkIn) {
    return res.status(400).json({ error: "Allaqachon kelgan deb belgilangan" });
  }

  const now = new Date();
  const status = computeStatus(now);

  const record = await db.staffAttendance.upsert({
    where: { userId_date: { userId, date: d } },
    update: { checkIn: now, status },
    create: { userId, date: d, checkIn: now, status },
  });

  res.json({ success: true, record });
}));

// PATCH { userId, date? } -> check-out
router.patch("/", ah(async (req, res) => {
  const parsed = checkOutSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { userId, date } = parsed.data;
  const d = toDate(date || todayStr());

  const existing = await db.staffAttendance.findUnique({ where: { userId_date: { userId, date: d } } });
  if (!existing?.checkIn) return res.status(400).json({ error: "Avval kelganini belgilang" });
  if (existing.checkOut) return res.status(400).json({ error: "Allaqachon ketgan deb belgilangan" });

  const record = await db.staffAttendance.update({
    where: { userId_date: { userId, date: d } },
    data: { checkOut: new Date() },
  });

  res.json({ success: true, record });
}));

export default router;
