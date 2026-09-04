import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  records: z.array(z.object({ leadId: z.string(), discountPercent: z.coerce.number().int().min(0).max(100) })),
});

// Discount is a billing decision — admin-only, unlike grading/attendance which a group's own
// teacher can also do.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const isAdminRole = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
  if (!isAdminRole) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  for (const r of parsed.data.records) {
    await db.lead.update({ where: { id: r.leadId }, data: { discountPercent: r.discountPercent } });
  }

  return NextResponse.json({ success: true, saved: parsed.data.records.length });
}
