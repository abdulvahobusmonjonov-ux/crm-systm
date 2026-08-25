import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as XLSX from "xlsx";
import { hasPermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import type { LeadSource } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const NAME_KEYS = ["f.i.sh", "fish", "f.i.o", "fio", "ism familya", "ism", "to'liq ism", "toliq ism", "fullname"];
const PHONE_KEYS = ["telefon", "phone", "tel"];

// Any source is accepted except WEBSITE — that value is reserved for leads that came
// through the public landing form, never for a bulk-imported spreadsheet.
const IMPORTABLE_SOURCES: LeadSource[] = [
  "INSTAGRAM", "TELEGRAM", "FACEBOOK", "TIKTOK", "REFERRAL", "WALK_IN", "PHONE_CALL", "OTHER",
];

function pick(row: Record<string, unknown>, keys: string[]): string {
  for (const [k, v] of Object.entries(row)) {
    if (keys.includes(k.trim().toLowerCase())) return String(v ?? "").trim();
  }
  return "";
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user;
  const isAdminRole = ["SUPER_ADMIN", "ADMIN"].includes(user.role);
  const canAdd = isAdminRole || user.canManageLeads || (await hasPermission(user, "leads", "add"));
  if (!canAdd) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fayl topilmadi" }, { status: 400 });
  }

  const requestedSource = String(formData.get("source") || "OTHER").toUpperCase();
  const source: LeadSource = IMPORTABLE_SOURCES.includes(requestedSource as LeadSource)
    ? (requestedSource as LeadSource)
    : "OTHER";

  let rows: Record<string, unknown>[];
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buf, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
  } catch {
    return NextResponse.json({ error: "Faylni o'qib bo'lmadi. .xlsx formatida yuklang" }, { status: 400 });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "Faylda ma'lumot topilmadi" }, { status: 400 });
  }

  const existingPhones = new Set(
    (await db.lead.findMany({ select: { phone: true } })).map((l) => l.phone.replace(/\D/g, ""))
  );
  const firstStage = await db.stage.findFirst({ orderBy: { order: "asc" } });

  const errors: { row: number; reason: string }[] = [];
  const seenPhones = new Set<string>();
  const toCreate: {
    fullName: string; phone: string; source: LeadSource; stageId: string | null; createdById: string;
  }[] = [];

  rows.forEach((row, i) => {
    const rowNum = i + 2; // +1 for 1-based, +1 for the header row
    const fullName = pick(row, NAME_KEYS);
    const phoneRaw = pick(row, PHONE_KEYS);
    const digits = phoneRaw.replace(/\D/g, "");

    if (!fullName || fullName.length < 2) {
      errors.push({ row: rowNum, reason: "F.I.Sh kiritilmagan yoki juda qisqa" });
      return;
    }
    if (digits.length < 9) {
      errors.push({ row: rowNum, reason: "Telefon raqam noto'g'ri yoki bo'sh" });
      return;
    }
    if (existingPhones.has(digits)) {
      errors.push({ row: rowNum, reason: `Telefon allaqachon mavjud: ${phoneRaw}` });
      return;
    }
    if (seenPhones.has(digits)) {
      errors.push({ row: rowNum, reason: `Faylda takrorlangan telefon: ${phoneRaw}` });
      return;
    }
    seenPhones.add(digits);

    toCreate.push({
      fullName,
      phone: phoneRaw,
      source,
      stageId: firstStage?.id ?? null,
      createdById: user.id,
    });
  });

  if (toCreate.length > 0) {
    await db.lead.createMany({ data: toCreate });
    await logAudit(user.id, user.fullName, "leads_import", "Lead", undefined, {
      created: toCreate.length,
      failed: errors.length,
      source,
    });
  }

  return NextResponse.json({
    total: rows.length,
    created: toCreate.length,
    failed: errors.length,
    errors,
  });
}
