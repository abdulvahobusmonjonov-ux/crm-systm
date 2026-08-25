import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDebtors } from "@/lib/debtors";
import { hasPermission } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdminRole = ["SUPER_ADMIN", "ADMIN"].includes(session.user.role);
  if (!isAdminRole && !(await hasPermission(session.user, "debtors_archive", "debtors_access"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");

  const result = await getDebtors(month);
  return NextResponse.json(result);
}
