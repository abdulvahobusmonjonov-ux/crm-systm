import { db } from "@/lib/db";

// Group ids the given user teaches — the scoping boundary for every /api/teacher/* route.
export async function getTeacherGroupIds(teacherId: string): Promise<string[]> {
  const groups = await db.group.findMany({
    where: { teacherId },
    select: { id: true },
  });
  return groups.map((g) => g.id);
}

// Who may set a student's rating (exam/lesson/exercise scores, leaderboard coins) for a
// given group: the teacher actually assigned to that group, or a staff member an admin has
// explicitly delegated grading to (the raw flag, not the role-based canManageGrades() helper,
// which auto-passes for SUPER_ADMIN/ADMIN — admins should not get blanket grading rights).
export async function canGradeGroup(user: { id: string; canManageGrades?: boolean }, groupId: string): Promise<boolean> {
  if (user.canManageGrades) return true;
  const groupIds = await getTeacherGroupIds(user.id);
  return groupIds.includes(groupId);
}
