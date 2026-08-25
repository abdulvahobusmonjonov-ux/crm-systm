import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import TeacherShell from "@/components/teacher/TeacherShell";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const isAdminRole = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
  if (!session.user.isTeacher && session.user.role !== "MENTOR" && !isAdminRole) redirect("/dashboard");

  return <TeacherShell>{children}</TeacherShell>;
}
