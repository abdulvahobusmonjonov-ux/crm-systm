import { db } from "./db.js";

// Fire-and-forget audit logger. Never throws.
export async function logAudit(userId, userName, action, entity, entityId, details) {
  try {
    await db.auditLog.create({
      data: {
        userId,
        userName: userName || null,
        action,
        entity,
        entityId: entityId || null,
        details: details ?? undefined,
      },
    });
  } catch {
    // ignore audit failures
  }
}
