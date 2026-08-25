import { db } from "./db.js";

// Group ids the given user teaches — the scoping boundary for every /api/teacher/* route.
export async function getTeacherGroupIds(teacherId) {
  const groups = await db.group.findMany({
    where: { teacherId },
    select: { id: true },
  });
  return groups.map((g) => g.id);
}
