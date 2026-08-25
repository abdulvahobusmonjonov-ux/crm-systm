import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

// Fire-and-forget audit logger. Never throws.
export async function logAudit(
  userId: string,
  userName: string | undefined,
  action: string,
  entity: string,
  entityId?: string,
  details?: Prisma.InputJsonValue
) {
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
