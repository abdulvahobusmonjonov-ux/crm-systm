import { db } from "./db.js";

// Shared between GET /api/leads (table view) and GET /api/leads/export (xlsx export)
// so the exported rows always match exactly what the current filters show on screen.
export async function buildLeadsWhere(searchParams, user) {
  const where = {};

  where.isArchived = searchParams.get("archived") === "1";
  if (searchParams.get("frozen") === "1") where.frozenAt = { not: null };

  if (user.role === "OPERATOR") {
    where.assignedToId = user.id;
  }

  const search = searchParams.get("search") || "";
  if (search) {
    const trimmed = search.trim();
    const tokens = trimmed.split(/\s+/).filter(Boolean);
    const digitsOnly = trimmed.replace(/\D/g, "");

    const orConditions = [
      { fullName: { contains: trimmed, mode: "insensitive" } },
      { phone: { contains: trimmed } },
      { email: { contains: trimmed, mode: "insensitive" } },
    ];

    if (tokens.length > 1) {
      orConditions.push({
        AND: tokens.map((t) => ({ fullName: { contains: t, mode: "insensitive" } })),
      });
    }

    if (digitsOnly.length >= 3) {
      const phoneMatches = await db.$queryRaw`
        SELECT id FROM "Lead"
        WHERE regexp_replace(phone, '\\D', '', 'g') LIKE ${"%" + digitsOnly + "%"}
           OR regexp_replace(COALESCE("phoneSecondary", ''), '\\D', '', 'g') LIKE ${"%" + digitsOnly + "%"}
      `;
      if (phoneMatches.length) {
        orConditions.push({ id: { in: phoneMatches.map((m) => m.id) } });
      }
    }

    where.OR = orConditions;
  }

  const status = searchParams.get("status") || "";
  if (status) where.status = status;
  const stageId = searchParams.get("stageId") || "";
  if (stageId) where.stageId = stageId;
  const courseId = searchParams.get("courseId") || "";
  if (courseId) where.courseId = courseId;
  const source = searchParams.get("source") || "";
  if (source) where.source = source;
  const timePreference = searchParams.get("timePreference") || "";
  if (timePreference) where.timePreference = timePreference;

  const assignedToId = searchParams.get("assignedToId") || "";
  if (assignedToId === "unassigned") {
    where.assignedToId = null;
  } else if (assignedToId) {
    where.assignedToId = assignedToId;
  }

  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";
  if (dateFrom || dateTo) {
    const createdAt = {};
    if (dateFrom) createdAt.gte = new Date(dateFrom);
    if (dateTo) createdAt.lte = new Date(dateTo + "T23:59:59");
    where.createdAt = createdAt;
  }

  return where;
}
