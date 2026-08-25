import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const leads = await db.lead.findMany({
    where: { coins: { gt: 0 } },
    orderBy: { coins: "desc" },
    take: 100,
    select: { id: true, fullName: true, coins: true, group: { select: { name: true } } },
  });
  return NextResponse.json(leads);
}
