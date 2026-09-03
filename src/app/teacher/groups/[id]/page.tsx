"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowLeft, MapPin, BookOpen } from "lucide-react";
import { MonthPicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import AttendanceTab from "./AttendanceTab";
import ScoresTab from "./ScoresTab";
import ExercisesTab from "./ExercisesTab";
import RankingTab from "./RankingTab";
import ExamsTab from "./ExamsTab";

interface GroupDetail {
  id: string;
  name: string;
  room: string | null;
  course: { name: string } | null;
  leads: { id: string; fullName: string; phone: string; coins: number }[];
}

const TABS = [
  { key: "attendance", label: "Davomat" },
  { key: "scores", label: "Ballar" },
  { key: "exercises", label: "Mashqlar" },
  { key: "ranking", label: "Reyting" },
  { key: "exams", label: "Imtihonlar" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function ym(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function TeacherGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params);
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdminRole = role === "SUPER_ADMIN" || role === "ADMIN";
  const backHref = isAdminRole ? "/timetable" : "/teacher/dashboard";
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<TabKey>("attendance");
  const [month, setMonth] = useState(ym(new Date()));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch(`/api/teacher/groups/${groupId}`)
      .then(async (res) => {
        if (!res.ok) { if (!cancelled) setError(true); return; }
        const d = await res.json();
        if (!cancelled) setGroup(d?.id ? d : null);
      })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [groupId]);

  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center gap-3">
        <Link href={backHref} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight truncate">
            {loading ? "Yuklanmoqda..." : group?.name || "Guruh topilmadi"}
          </h1>
          {group && (
            <div className="flex items-center gap-3 mt-0.5 text-[13px] text-gray-400 dark:text-gray-500">
              {group.course && <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{group.course.name}</span>}
              {group.room && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{group.room}</span>}
            </div>
          )}
        </div>
      </div>

      {!loading && error ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm py-16 text-center text-[13px] text-red-500">
          Ma&apos;lumotni yuklab bo&apos;lmadi. Sahifani yangilab ko&apos;ring.
        </div>
      ) : !loading && !group ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm py-16 text-center text-[13px] text-gray-400">
          Bu guruh topilmadi yoki sizga tegishli emas.
        </div>
      ) : (
        <>
          {/* Tabs + month picker */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 rounded-xl p-1 overflow-x-auto">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "px-3.5 py-2 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap",
                    tab === t.key ? "bg-white dark:bg-gray-800 text-[#5E2CA5] shadow-sm" : "text-gray-500 dark:text-gray-400"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <MonthPicker
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-white dark:bg-gray-900"
            />
          </div>

          {group && (
            <>
              {tab === "attendance" && <AttendanceTab groupId={groupId} month={month} />}
              {tab === "scores" && <ScoresTab groupId={groupId} month={month} />}
              {tab === "exercises" && <ExercisesTab groupId={groupId} month={month} />}
              {tab === "ranking" && <RankingTab groupId={groupId} month={month} />}
              {tab === "exams" && <ExamsTab groupId={groupId} />}
            </>
          )}
        </>
      )}
    </div>
  );
}
