import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyTelegramInitData } from "@/lib/telegram-auth";

export const dynamic = "force-dynamic";

async function getToken() {
  const s = await db.setting.findUnique({ where: { key: "telegram_bot_token" } });
  return s?.value || process.env.TELEGRAM_BOT_TOKEN || "";
}

function ym(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function POST(req: NextRequest) {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: "Bot sozlanmagan" }, { status: 500 });

  let body: { initData?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const initData = body.initData || "";
  const result = verifyTelegramInitData(initData, token);
  if (!result.valid || !result.user) {
    return NextResponse.json({ error: "Tasdiqlanmadi", reason: result.error }, { status: 401 });
  }

  const chatId = String(result.user.id);
  const lead = await db.lead.findFirst({
    where: { telegramChatId: chatId, isArchived: false },
    include: {
      course: true,
      group: { include: { teacher: true, course: true } },
      timeSlot: true,
    },
  });

  if (!lead) {
    return NextResponse.json({ error: "not_linked" }, { status: 404 });
  }

  const [attendances, payments, scores] = await Promise.all([
    db.attendance.findMany({
      where: { leadId: lead.id },
      orderBy: { date: "desc" },
      take: 30,
    }),
    db.payment.findMany({
      where: { leadId: lead.id },
      orderBy: { paidAt: "desc" },
      take: 10,
    }),
    db.score.findMany({
      where: { leadId: lead.id },
      include: { exam: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const attTotal = attendances.length;
  const attPresent = attendances.filter((a) => a.status === "present" || a.status === "late").length;
  const attAbsent = attendances.filter((a) => a.status === "absent").length;
  const attLate = attendances.filter((a) => a.status === "late").length;
  const attExcused = attendances.filter((a) => a.status === "excused").length;
  const attPercent = attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : null;

  const currentMonth = ym(new Date());
  const paidThisMonth = payments.some((p) => p.forMonth === currentMonth);
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount) - Number(p.discount || 0), 0);

  const avgScore =
    scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length) : null;

  return NextResponse.json({
    student: {
      fullName: lead.fullName,
      phone: lead.phone,
      coins: lead.coins,
      courseName: lead.course?.name || null,
    },
    group: lead.group
      ? {
          name: lead.group.name,
          courseName: lead.group.course?.name || null,
          teacherName: lead.group.teacher?.fullName || null,
          days: lead.group.days,
          timeFrom: lead.group.timeFrom,
          timeTo: lead.group.timeTo,
          room: lead.group.room,
        }
      : null,
    attendance: {
      total: attTotal,
      present: attPresent,
      absent: attAbsent,
      late: attLate,
      excused: attExcused,
      percent: attPercent,
      recent: attendances.slice(0, 10).map((a) => ({ date: a.date, status: a.status })),
    },
    payments: {
      paidThisMonth,
      currentMonth,
      totalPaid,
      history: payments.map((p) => ({
        amount: Number(p.amount),
        discount: p.discount ? Number(p.discount) : null,
        forMonth: p.forMonth,
        paidAt: p.paidAt,
        type: p.type,
      })),
    },
    scores: {
      average: avgScore,
      list: scores.map((s) => ({
        examTitle: s.exam.title,
        date: s.exam.date,
        score: s.score,
        maxScore: s.exam.maxScore,
      })),
    },
  });
}
