import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { LEAD_STATUS_LABELS, LEAD_SOURCE_LABELS } from "@/lib/constants";
import { buildLeadsWhere } from "@/lib/leads";

export const dynamic = "force-dynamic";

// Exports exactly the leads the /leads table currently shows — same filters
// (search, status, course, source, assignedTo, date range, archived/frozen toggles)
// as GET /api/leads, built via the shared buildLeadsWhere() helper.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const where = await buildLeadsWhere(searchParams, session.user);

  const leads = await db.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      course: { select: { name: true } },
    },
  });

  const data = leads.map((l) => ({
    "F.I.Sh": l.fullName,
    "Telefon": l.phone,
    "Kurs": l.course?.name || "",
    "Holat": LEAD_STATUS_LABELS[l.status] || l.status,
    "Manba": LEAD_SOURCE_LABELS[l.source] || l.source,
    "Sana": format(l.createdAt, "dd.MM.yyyy HH:mm"),
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [{ wch: 24 }, { wch: 16 }, { wch: 22 }, { wch: 18 }, { wch: 16 }, { wch: 16 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Lidlar");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="lidlar_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx"`,
    },
  });
}
