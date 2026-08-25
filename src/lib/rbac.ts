import { db } from "@/lib/db";

// Granular permission check backing the "Rollar va ruxsatlar" catalog. Admins always
// bypass (consistent with every other permission helper in this codebase); everyone
// else needs an explicit granted UserPermission row for that module+action.
export async function hasPermission(
  user: { id: string; role: string },
  module: string,
  action: string
): Promise<boolean> {
  if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") return true;

  const grant = await db.userPermission.findFirst({
    where: { userId: user.id, granted: true, permission: { module, action } },
    select: { id: true },
  });
  return !!grant;
}
