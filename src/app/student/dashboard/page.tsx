"use client";

import { useState, useEffect } from "react";
import { CalendarCheck, Coins, Wallet, GraduationCap, ClipboardList, Users, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatDate, formatDateTime, cn } from "@/lib/utils";

interface ExamScore { id: string; score: number; createdAt: string; exam: { title: string; maxScore: number } | null; }
interface LessonScore { score: number; date: string; }
interface ExerciseScore { score: number; exercise: { title: string; date: string } | null; }
interface HomeworkItem { id: string; status: string; grade: number | null; teacherNote: string | null; submittedAt: string; exercise: { title: string } | null; }

interface DashboardData {
  fullName: string;
  group: { id: string; name: string } | null;
  course: { id: string; name: string } | null;
  coins: number;
  attendance: { present: number; absent: number; excused: number; percent: number | null };
  examScores: ExamScore[];
  lessonScores: LessonScore[];
  exerciseScores: ExerciseScore[];
  homework: HomeworkItem[];
  payment: { balance: number; month: string };
}

type Tab = "grades" | "homework";

export default function StudentDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<Tab>("grades");

  useEffect(() => {
    fetch("/api/student/dashboard")
      .then(async (res) => {
        if (!res.ok) { setError(true); return; }
        setData(await res.json());
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-3 sm:p-4 lg:p-6 space-y-4">
        <div className="h-32 bg-white dark:bg-gray-900 rounded-2xl shadow-sm animate-pulse" />
        <div className="h-64 bg-white dark:bg-gray-900 rounded-2xl shadow-sm animate-pulse" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="p-3 sm:p-4 lg:p-6">
        <Card className="py-16 text-center text-[13px] text-red-500">Ma&apos;lumotni yuklab bo&apos;lmadi. Sahifani yangilab ko&apos;ring.</Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="max-w-3xl mx-auto space-y-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Assalomu alaykum, {data.fullName}!</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap text-[13px] text-gray-500 dark:text-gray-400">
            {data.course && <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{data.course.name}</span>}
            {data.group && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{data.group.name}</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#5E2CA5]/10 flex items-center justify-center flex-shrink-0">
              <CalendarCheck className="w-5 h-5 text-[#5E2CA5]" />
            </div>
            <div>
              <p className="text-[12px] text-gray-400 mb-0.5">Davomat</p>
              <p className="text-[18px] font-bold text-gray-900 dark:text-white leading-tight">{data.attendance.percent !== null ? `${data.attendance.percent}%` : "—"}</p>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <Coins className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-[12px] text-gray-400 mb-0.5">Kristall</p>
              <p className="text-[18px] font-bold text-gray-900 dark:text-white leading-tight">{data.coins}</p>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <Wallet className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] text-gray-400 mb-0.5">To&apos;lov holati ({data.payment.month})</p>
              <p className={cn("text-[15px] font-bold leading-tight truncate", data.payment.balance > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400")}>
                {Math.abs(data.payment.balance).toLocaleString("ru-RU")} so&apos;m {data.payment.balance > 0 ? "qarzdorlik" : ""}
              </p>
            </div>
          </Card>
        </div>

        <Card className="rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100 dark:border-white/10 px-4">
            <button
              onClick={() => setTab("grades")}
              className={cn(
                "flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                tab === "grades" ? "border-[#5E2CA5] text-[#5E2CA5]" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              <GraduationCap className="w-4 h-4" /> Ballar
            </button>
            <button
              onClick={() => setTab("homework")}
              className={cn(
                "flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                tab === "homework" ? "border-[#5E2CA5] text-[#5E2CA5]" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              <ClipboardList className="w-4 h-4" /> Uy vazifalari
            </button>
          </div>

          <div className="p-4">
            {tab === "grades" && (
              <div className="space-y-1.5">
                {data.examScores.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-sm px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5">
                    <span className="text-gray-600 dark:text-gray-300 truncate">{s.exam?.title || "Imtihon"} · {formatDate(s.createdAt)}</span>
                    <span className="font-medium text-gray-900 dark:text-white flex-shrink-0">{s.score}{s.exam?.maxScore ? `/${s.exam.maxScore}` : ""}</span>
                  </div>
                ))}
                {data.exerciseScores.map((s, i) => (
                  <div key={`ex-${i}`} className="flex items-center justify-between text-sm px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5">
                    <span className="text-gray-600 dark:text-gray-300 truncate">{s.exercise?.title || "Mashq"}{s.exercise?.date ? ` · ${formatDate(s.exercise.date)}` : ""}</span>
                    <span className="font-medium text-gray-900 dark:text-white flex-shrink-0">{s.score}</span>
                  </div>
                ))}
                {data.lessonScores.map((s, i) => (
                  <div key={`ls-${i}`} className="flex items-center justify-between text-sm px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5">
                    <span className="text-gray-600 dark:text-gray-300 truncate">Dars bali · {formatDate(s.date)}</span>
                    <span className="font-medium text-gray-900 dark:text-white flex-shrink-0">{s.score}</span>
                  </div>
                ))}
                {data.examScores.length === 0 && data.exerciseScores.length === 0 && data.lessonScores.length === 0 && (
                  <p className="text-center text-gray-400 py-8">Ballar yo&apos;q</p>
                )}
              </div>
            )}

            {tab === "homework" && (
              <div className="space-y-1.5">
                {data.homework.map((h) => (
                  <div key={h.id} className="flex items-center justify-between text-sm px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5">
                    <div className="min-w-0">
                      <p className="text-gray-800 dark:text-gray-200 truncate">{h.exercise?.title || "Topshiriq"}</p>
                      <p className="text-[11px] text-gray-400">{formatDateTime(h.submittedAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {h.grade !== null && <span className="font-medium text-gray-900 dark:text-white">{h.grade}</span>}
                      <span className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                        h.status === "checked" ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400"
                      )}>
                        {h.status === "checked" ? "Tekshirilgan" : "Tekshirilmagan"}
                      </span>
                    </div>
                  </div>
                ))}
                {data.homework.length === 0 && <p className="text-center text-gray-400 py-8">Topshiriqlar yo&apos;q</p>}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
