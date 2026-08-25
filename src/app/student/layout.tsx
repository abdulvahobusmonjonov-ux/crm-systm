import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import StudentShell from "@/components/student/StudentShell";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.accountType !== "student") redirect("/dashboard");

  return <StudentShell>{children}</StudentShell>;
}
