import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function periodStart(period: string): Date | null {
  const now = new Date();
  if (period === "week") { const d = new Date(now); d.setDate(d.getDate() - 7); return d; }
  if (period === "month") { const d = new Date(now); d.setMonth(d.getMonth() - 1); return d; }
  if (period === "year") { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d; }
  return null; // "all" — lifetime, use Lead.coins directly
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "all";
  const from = periodStart(period);

  if (!from) {
    const leads = await db.lead.findMany({
      where: { coins: { gt: 0 } },
      orderBy: { coins: "desc" },
      take: 100,
      select: { id: true, fullName: true, coins: true, group: { select: { name: true } }, course: { select: { name: true } } },
    });
    return NextResponse.json(leads);
  }

  // Period totals aren't stored anywhere — sum each student's CoinTx within the window.
  const sums = await db.coinTx.groupBy({
    by: ["leadId"],
    where: { createdAt: { gte: from } },
    _sum: { amount: true },
  });
  const positive = sums
    .map((s) => ({ leadId: s.leadId, coins: s._sum.amount ?? 0 }))
    .filter((s) => s.coins > 0)
    .sort((a, b) => b.coins - a.coins)
    .slice(0, 100);

  if (positive.length === 0) return NextResponse.json([]);

  const leads = await db.lead.findMany({
    where: { id: { in: positive.map((p) => p.leadId) } },
    select: { id: true, fullName: true, group: { select: { name: true } }, course: { select: { name: true } } },
  });
  const leadMap = new Map(leads.map((l) => [l.id, l]));

  const result = positive
    .map((p) => {
      const lead = leadMap.get(p.leadId);
      if (!lead) return null;
      return { ...lead, coins: p.coins };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return NextResponse.json(result);
}
