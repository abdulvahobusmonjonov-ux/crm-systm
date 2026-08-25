import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { LEAD_STATUS_LABELS, LEAD_SOURCE_LABELS } from "@/lib/constants";
import { Prisma, type LeadStatus } from "@/generated/prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "";

  const where: Prisma.LeadWhereInput = {};
  if (user.role === "OPERATOR") where.assignedToId = user.id;
  if (status) where.status = status as LeadStatus;

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
    "Qo'shilgan sana": format(l.createdAt, "dd.MM.yyyy HH:mm"),
    "Yozilgan sana": l.enrolledAt ? format(l.enrolledAt, "dd.MM.yyyy") : "",
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

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="lidlar_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx"`,
    },
  });
}
