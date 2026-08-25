import { Router } from "express";
import { db } from "../lib/db.js";
import { ah } from "../lib/http.js";
import { TZ } from "../lib/dates.js";

const router = Router();

const SOURCE_LABELS = {
  INSTAGRAM: "Instagram", TELEGRAM: "Telegram", FACEBOOK: "Facebook", TIKTOK: "TikTok",
  REFERRAL: "Tavsiya", WEBSITE: "Sayt", WALK_IN: "Kelgan", PHONE_CALL: "Qo'ng'iroq", OTHER: "Boshqa",
};

// GET /api/analytics
router.get("/", ah(async (req, res) => {
  const [leads, payments] = await Promise.all([
    db.lead.findMany({ select: { source: true, status: true, assignedToId: true, assignedTo: { select: { fullName: true } } } }),
    db.payment.findMany({ select: { amount: true, forMonth: true, paidAt: true, lead: { select: { source: true, assignedToId: true } } } }),
  ]);

  // By source
  const srcMap = {};
  for (const l of leads) {
    const s = l.source || "OTHER";
    srcMap[s] ||= { count: 0, enrolled: 0, revenue: 0 };
    srcMap[s].count++;
    if (l.status === "ENROLLED") srcMap[s].enrolled++;
  }
  for (const p of payments) {
    const s = p.lead?.source || "OTHER";
    srcMap[s] ||= { count: 0, enrolled: 0, revenue: 0 };
    srcMap[s].revenue += Number(p.amount || 0);
  }
  const bySource = Object.entries(srcMap).map(([k, v]) => ({
    source: SOURCE_LABELS[k] || k, ...v,
    conversion: v.count ? Math.round((v.enrolled / v.count) * 100) : 0,
  })).sort((a, b) => b.count - a.count);

  // By manager
  const mgrMap = {};
  for (const l of leads) {
    const id = l.assignedToId || "none";
    mgrMap[id] ||= { name: l.assignedTo?.fullName || "Biriktirilmagan", total: 0, enrolled: 0, revenue: 0 };
    mgrMap[id].total++;
    if (l.status === "ENROLLED") mgrMap[id].enrolled++;
  }
  for (const p of payments) {
    const id = p.lead?.assignedToId || "none";
    if (mgrMap[id]) mgrMap[id].revenue += Number(p.amount || 0);
  }
  const byManager = Object.values(mgrMap).map((m) => ({
    ...m, conversion: m.total ? Math.round((m.enrolled / m.total) * 100) : 0,
  })).sort((a, b) => b.revenue - a.revenue);

  // Monthly revenue (last 6 months)
  const now = new Date(Date.now() + TZ);
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    months.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  const monthRev = {};
  months.forEach((m) => (monthRev[m] = 0));
  for (const p of payments) {
    const key = p.forMonth || `${new Date(p.paidAt).getUTCFullYear()}-${String(new Date(p.paidAt).getUTCMonth() + 1).padStart(2, "0")}`;
    if (key in monthRev) monthRev[key] += Number(p.amount || 0);
  }
  const monthly = months.map((m) => ({ month: m, revenue: monthRev[m] }));

  // Forecast: simple avg of last 3 months
  const last3 = monthly.slice(-3).map((m) => m.revenue);
  const forecast = Math.round(last3.reduce((a, b) => a + b, 0) / (last3.length || 1));

  const totals = {
    leads: leads.length,
    enrolled: leads.filter((l) => l.status === "ENROLLED").length,
    revenue: payments.reduce((a, p) => a + Number(p.amount || 0), 0),
  };

  res.json({ bySource, byManager, monthly, forecast, totals });
}));

export default router;
