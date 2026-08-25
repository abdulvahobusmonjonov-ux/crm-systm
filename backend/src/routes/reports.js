import { Router } from "express";
import { startOfDay, endOfDay, parseISO, format as fmtDate } from "date-fns";
import * as XLSX from "xlsx";
import { db } from "../lib/db.js";
import { ah, requireRole } from "../lib/http.js";
import { canSeeReports } from "../lib/permissions.js";
import { monthRange, currentMonth } from "../lib/dates.js";
import { LEAD_STATUS_LABELS, LEAD_SOURCE_LABELS } from "../lib/constants.js";

const router = Router();

// ---------------------------------------------------------------- GET /api/reports
router.get("/", ah(async (req, res) => {
  const { from, to } = req.query;

  const dateFilter = {};
  if (from) dateFilter.gte = startOfDay(parseISO(String(from)));
  if (to) dateFilter.lte = endOfDay(parseISO(String(to)));
  const where = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};

  const stages = await db.stage.findMany({ orderBy: { order: "asc" } });
  const wonStageIds = stages.filter(s => s.isWon).map(s => s.id);
  const inProgressStageIds = stages.filter(s => !s.isWon && !s.isLost).map(s => s.id);

  const [
    totalLeads, stageGroups, sourceDist, courseStats,
    enrolledLeads, userStats, potentialLeads,
  ] = await Promise.all([
    db.lead.count({ where }),
    db.lead.groupBy({ by: ["stageId"], _count: { id: true }, where }),
    db.lead.groupBy({ by: ["source"], _count: { id: true }, where }),
    db.lead.groupBy({ by: ["courseId"], _count: { id: true }, where: { ...where, courseId: { not: null } } }),
    wonStageIds.length
      ? db.lead.findMany({ where: { ...where, stageId: { in: wonStageIds } }, include: { course: { select: { price: true, currency: true } } } })
      : Promise.resolve([]),
    db.user.findMany({
      select: { id: true, fullName: true, _count: { select: { leads: true, createdLeads: true } } },
    }),
    inProgressStageIds.length
      ? db.lead.findMany({ where: { ...where, stageId: { in: inProgressStageIds } }, include: { course: { select: { price: true } } } })
      : Promise.resolve([]),
  ]);

  const courseIds = courseStats.map(c => c.courseId).filter(Boolean);
  const courses = await db.course.findMany({ where: { id: { in: courseIds } }, select: { id: true, name: true, color: true, price: true } });
  const courseMap = Object.fromEntries(courses.map(c => [c.id, c]));

  const actualRevenue = enrolledLeads.reduce((sum, l) => sum + (l.course ? parseFloat(String(l.course.price)) : 0), 0);
  const potentialRevenue = potentialLeads.reduce((sum, l) => sum + (l.course ? parseFloat(String(l.course.price)) : 0), 0);

  const countByStage = Object.fromEntries(stageGroups.map(g => [g.stageId ?? "none", g._count.id]));
  const enrolled = wonStageIds.reduce((sum, id) => sum + (countByStage[id] ?? 0), 0);
  const conversionRate = totalLeads > 0 ? ((enrolled / totalLeads) * 100).toFixed(1) : "0";

  res.json({
    totalLeads,
    conversionRate,
    actualRevenue,
    potentialRevenue,
    enrolledCount: enrolled,
    stageDistribution: stages.map(s => ({ stageId: s.id, name: s.name, color: s.color, count: countByStage[s.id] ?? 0 })),
    sourceDistribution: sourceDist.map(s => ({ source: s.source, count: s._count.id })),
    courseStats: courseStats.map(c => ({
      courseId: c.courseId,
      course: c.courseId ? courseMap[c.courseId] : null,
      count: c._count.id,
    })),
    userStats: userStats.map(u => ({
      id: u.id, fullName: u.fullName,
      totalLeads: u._count.leads,
      createdLeads: u._count.createdLeads,
    })),
  });
}));

// -------------------------------------------------------- GET /api/reports/export
router.get("/export", ah(async (req, res) => {
  const user = req.user;
  const status = req.query.status || "";

  const where = {};
  if (user.role === "OPERATOR") where.assignedToId = user.id;
  if (status) where.status = status;

  const leads = await db.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      course: { select: { name: true } },
      timeSlot: { select: { label: true } },
      assignedTo: { select: { fullName: true } },
    },
  });

  const data = leads.map((l) => ({
    "Ism familya": l.fullName,
    "Telefon": l.phone,
    "Qo'shimcha tel": l.phoneSecondary || "",
    "Email": l.email || "",
    "Yoshi": l.age ?? "",
    "Kurs": l.course?.name || "",
    "Dars kunlari": l.preferredDays || "",
    "Dars vaqti": l.lessonTime || "",
    "Holat": LEAD_STATUS_LABELS[l.status] || l.status,
    "Manba": LEAD_SOURCE_LABELS[l.source] || l.source,
    "Mas'ul hodim": l.assignedTo?.fullName || "",
    "Izoh": l.notes || "",
    "Qo'shilgan sana": fmtDate(l.createdAt, "dd.MM.yyyy HH:mm"),
    "Yozilgan sana": l.enrolledAt ? fmtDate(l.enrolledAt, "dd.MM.yyyy") : "",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  // Column widths for readability
  ws["!cols"] = [
    { wch: 22 }, { wch: 16 }, { wch: 16 }, { wch: 22 }, { wch: 6 },
    { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 16 },
    { wch: 18 }, { wch: 30 }, { wch: 18 }, { wch: 14 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Lidlar");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="lidlar_${fmtDate(new Date(), "yyyyMMdd_HHmm")}.xlsx"`);
  res.send(buf);
}));

// ----------------------------------------------------- GET /api/reports/financial
const SALARY_TYPE_LABELS = { salary: "Oylik maosh", bonus: "Bonuslar" };
const PAYMENT_TYPE_LABELS = { tuition: "O'quv to'lovlari" };

async function buildReport(month) {
  const { start, end } = monthRange(month);

  const [paymentGroups, incomeGroups, expenseGroups, salaryGroups, students] = await Promise.all([
    db.payment.groupBy({ by: ["type"], where: { paidAt: { gte: start, lt: end } }, _sum: { amount: true } }),
    db.income.groupBy({ by: ["source"], where: { receivedAt: { gte: start, lt: end } }, _sum: { amount: true } }),
    db.expense.groupBy({ by: ["category"], where: { spentAt: { gte: start, lt: end } }, _sum: { amount: true } }),
    db.salaryRecord.groupBy({ by: ["type"], where: { paidAt: { gte: start, lt: end } }, _sum: { amount: true } }),
    db.lead.findMany({
      where: { status: "ENROLLED", groupId: { not: null }, isArchived: false },
      select: { id: true, course: { select: { price: true } } },
    }),
  ]);

  const categories = [];

  for (const g of paymentGroups) {
    const amount = Number(g._sum.amount ?? 0);
    if (amount <= 0) continue;
    categories.push({ type: "revenue", category: PAYMENT_TYPE_LABELS[g.type] || g.type, amount });
  }
  for (const g of incomeGroups) {
    const amount = Number(g._sum.amount ?? 0);
    if (amount <= 0) continue;
    categories.push({ type: "revenue", category: g.source, amount });
  }
  for (const g of expenseGroups) {
    const amount = Number(g._sum.amount ?? 0);
    if (amount <= 0) continue;
    categories.push({ type: "expense", category: g.category, amount });
  }
  for (const g of salaryGroups) {
    const amount = Number(g._sum.amount ?? 0);
    if (amount <= 0) continue;
    categories.push({ type: "payroll", category: SALARY_TYPE_LABELS[g.type] || g.type, amount });
  }

  // Qarzdorlik: outstanding tuition debt of enrolled students for this month
  const leadIds = students.map((s) => s.id);
  const monthPayments = leadIds.length
    ? await db.payment.groupBy({ by: ["leadId"], where: { forMonth: month, leadId: { in: leadIds } }, _sum: { amount: true } })
    : [];
  const paidMap = new Map(monthPayments.map((p) => [p.leadId, Number(p._sum.amount ?? 0)]));
  const totalDebt = students.reduce((sum, s) => {
    const required = Number(s.course?.price ?? 0);
    const paid = paidMap.get(s.id) ?? 0;
    return sum + Math.max(required - paid, 0);
  }, 0);

  const totalRevenue = categories.filter((c) => c.type === "revenue").reduce((a, c) => a + c.amount, 0);
  const totalExpense = categories.filter((c) => c.type === "expense").reduce((a, c) => a + c.amount, 0);
  const totalPayroll = categories.filter((c) => c.type === "payroll").reduce((a, c) => a + c.amount, 0);
  const netProfit = totalRevenue - totalExpense - totalPayroll;

  categories.sort((a, b) => b.amount - a.amount);

  return {
    month,
    totals: { totalRevenue, totalExpense, totalPayroll, netProfit, totalDebt },
    categories,
  };
}

function toCSV(report) {
  const TYPE_LABELS = { revenue: "Daromad", expense: "Xarajat", payroll: "Ish haqi" };
  const lines = [];
  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;

  lines.push(["Moliyaviy hisobot", report.month].map(esc).join(","));
  lines.push("");
  lines.push(["Ko'rsatkich", "Summa (so'm)"].map(esc).join(","));
  lines.push(["Jami tushum", report.totals.totalRevenue].map(esc).join(","));
  lines.push(["Xarajat", report.totals.totalExpense].map(esc).join(","));
  lines.push(["Ish haqi", report.totals.totalPayroll].map(esc).join(","));
  lines.push(["Sof foyda", report.totals.netProfit].map(esc).join(","));
  lines.push(["Qarzdorlik", report.totals.totalDebt].map(esc).join(","));
  lines.push("");
  lines.push(["Turi", "Kategoriya", "Summa (so'm)"].map(esc).join(","));
  for (const c of report.categories) {
    lines.push([TYPE_LABELS[c.type], c.category, c.amount].map(esc).join(","));
  }
  return "﻿" + lines.join("\r\n");
}

router.get("/financial", ah(async (req, res) => {
  const isAdminRole = ["SUPER_ADMIN", "ADMIN"].includes(req.user.role);
  if (!isAdminRole && !canSeeReports(req.user)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const month = req.query.month || currentMonth();
  const outputFormat = req.query.format || "json";

  const report = await buildReport(String(month));

  if (outputFormat === "csv") {
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="moliyaviy_hisobot_${month}.csv"`);
    return res.send(toCSV(report));
  }

  res.json(report);
}));

// ------------------------------------------- GET /api/reports/teacher-performance
router.get("/teacher-performance", requireRole("SUPER_ADMIN", "ADMIN"), ah(async (req, res) => {
  const groups = await db.group.findMany({
    where: { teacherId: { not: null }, isArchived: false },
    select: { id: true, teacherId: true, teacher: { select: { fullName: true } }, _count: { select: { leads: true } } },
  });
  const groupIds = groups.map((g) => g.id);

  const [att, pays] = await Promise.all([
    groupIds.length ? db.attendance.findMany({ where: { groupId: { in: groupIds } }, select: { groupId: true, status: true } }) : Promise.resolve([]),
    groupIds.length ? db.payment.findMany({ where: { groupId: { in: groupIds } }, select: { groupId: true, amount: true } }) : Promise.resolve([]),
  ]);

  const g2t = {};
  groups.forEach((g) => (g2t[g.id] = g.teacherId));

  const map = {};
  for (const g of groups) {
    const t = g.teacherId;
    map[t] ||= { name: g.teacher?.fullName || "—", groups: 0, students: 0, present: 0, total: 0, revenue: 0 };
    map[t].groups++;
    map[t].students += g._count.leads;
  }
  for (const a of att) { if (!a.groupId) continue; const t = g2t[a.groupId]; if (map[t]) { map[t].total++; if (a.status === "present") map[t].present++; } }
  for (const p of pays) { if (!p.groupId) continue; const t = g2t[p.groupId]; if (map[t]) map[t].revenue += Number(p.amount || 0); }

  const teachers = Object.values(map).map((m) => ({
    ...m,
    attendance: m.total ? Math.round((m.present / m.total) * 100) : 0,
  })).sort((a, b) => b.revenue - a.revenue);

  res.json(teachers);
}));

export default router;
