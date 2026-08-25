// Unauthenticated endpoints: landing-page lead form + branding.
// Mounted BEFORE authMiddleware in server.js.
import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/db.js";
import { ah } from "../lib/http.js";

const router = Router();

const schema = z.object({
  fullName: z.string().min(2, "Ism kiriting"),
  phone: z.string().min(7, "Telefon raqam kiriting"),
  courseId: z.string().optional().nullable(),
  preferredDays: z.string().optional().nullable(),
  lessonTime: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  referrerName: z.string().optional().nullable(),
  referrerPhone: z.string().optional().nullable(),
  website: z.string().optional(), // honeypot
});

// GET /api/public/lead — public form config: active courses + branding
router.get("/lead", ah(async (req, res) => {
  try {
    const [courses, settings] = await Promise.all([
      db.course.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
      db.setting.findMany({ where: { key: { in: ["brand_logo", "center_name"] } } }),
    ]);
    const map = {};
    settings.forEach((s) => (map[s.key] = s.value));
    res.json({ courses, name: map["center_name"] || "Robocode CRM", logo: map["brand_logo"] || "" });
  } catch {
    res.json({ courses: [], name: "Robocode CRM", logo: "" });
  }
}));

// POST /api/public/lead
router.post("/lead", ah(async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Ma'lumotlar to'liq emas" });
  const d = parsed.data;

  // honeypot: silently accept bots without creating
  if (d.website) return res.json({ success: true });

  // need a creator user (system) — use first admin
  const admin = await db.user.findFirst({ where: { role: { in: ["SUPER_ADMIN", "ADMIN"] } }, select: { id: true } });
  if (!admin) return res.status(500).json({ error: "Tizim sozlanmagan" });

  const firstStage = await db.stage.findFirst({ orderBy: { order: "asc" } });

  const lead = await db.lead.create({
    data: {
      fullName: d.fullName.trim(),
      phone: d.phone.replace(/[^\d+]/g, ""),
      courseId: d.courseId || null,
      preferredDays: d.preferredDays || null,
      lessonTime: d.lessonTime || null,
      notes: d.note || null,
      referrerName: d.referrerName || null,
      referrerPhone: d.referrerPhone || null,
      source: d.referrerName || d.referrerPhone ? "REFERRAL" : "WEBSITE",
      stageId: firstStage?.id || null,
      createdById: admin.id,
    },
  });
  await db.activity.create({ data: { leadId: lead.id, userId: admin.id, action: "lead_created", details: { via: "web_form" } } });

  res.json({ success: true });
}));

export default router;
