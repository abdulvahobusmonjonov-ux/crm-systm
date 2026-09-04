"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowLeft, MapPin, BookOpen, GraduationCap, CalendarCheck, Calendar, Clock, Wallet, MoreVertical } from "lucide-react";
import { MonthPicker } from "@/components/ui/date-picker";
import { Card } from "@/components/ui/card";
import { cn, formatPhone } from "@/lib/utils";
import { WEEKDAYS } from "@/lib/constants";
import AttendanceTab from "./AttendanceTab";
import ScoresTab from "./ScoresTab";
import ExercisesTab from "./ExercisesTab";
import RankingTab from "./RankingTab";
import ExamsTab from "./ExamsTab";
import DiscountTab from "./DiscountTab";
import TarixTab from "./TarixTab";
import NotesTab from "./NotesTab";

type StatusTag = "trial" | "frozen" | "debtor" | "active";

interface StudentRow {
  id: string; fullName: string; phone: string; coins: number; discountPercent: number; statusTag: StatusTag;
}
interface GroupDetail {
  id: string;
  name: string;
  room: string | null;
  days: string | null;
  timeFrom: string | null;
  timeTo: string | null;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  lessonsHeld: number;
  course: { name: string; price: number | null } | null;
  teacher: { id: string; fullName: string; phone: string | null } | null;
  leads: StudentRow[];
}

const TABS = [
  { key: "attendance", label: "Davomat" },
  { key: "scores", label: "Baholash" },
  { key: "exercises", label: "Mashqlar" },
  { key: "discount", label: "Chegirma" },
  { key: "ranking", label: "Reyting" },
  { key: "exams", label: "Imtihonlar" },
  { key: "history", label: "Tarix" },
  { key: "notes", label: "Izoh" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const STATUS_DOT: Record<StatusTag, string> = {
  debtor: "bg-red-500",
  trial: "bg-sky-500",
  frozen: "bg-amber-400",
  active: "bg-emerald-500",
};
const STATUS_LEGEND: { key: StatusTag; label: string }[] = [
  { key: "debtor", label: "Qarzdorlar" },
  { key: "trial", label: "Sinov davomida" },
  { key: "active", label: "Faol" },
  { key: "frozen", label: "Muzlatilgan" },
];

function ym(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }
function money(v: number | null) { return Number(v || 0).toLocaleString("ru-RU"); }
function fmtDate(v: string | null) { return v ? new Date(v).toLocaleDateString("ru-RU") : "—"; }
function dayLabel(v: string) { return WEEKDAYS.find((d) => d.value === v)?.label ?? v; }

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

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/teacher/groups/${groupId}`);
      if (!res.ok) { setError(true); setLoading(false); return; }
      const d = await res.json();
      setGroup(d?.id ? d : null);
    } catch {
      setError(true);
    }
    setLoading(false);
  }, [groupId]);

  useEffect(() => { load(); }, [load]);

  const daysList = (group?.days || "").split(",").map((s) => s.trim()).filter(Boolean);

  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center gap-3">
        <Link href={backHref} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 transition-colors flex-shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-semibold text-gray-500 dark:text-gray-400">Guruh tafsilotlari</h1>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm py-16 text-center text-[13px] text-gray-400 animate-pulse">Yuklanmoqda...</div>
      ) : error ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm py-16 text-center text-[13px] text-red-500">
          Ma&apos;lumotni yuklab bo&apos;lmadi. Sahifani yangilab ko&apos;ring.
        </div>
      ) : !group ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm py-16 text-center text-[13px] text-gray-400">
          Bu guruh topilmadi yoki sizga tegishli emas.
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-5 items-start">

          {/* ── Left: group info + student list ── */}
          <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
            <Card className="p-5 space-y-3">
              <h2 className="text-[16px] font-bold text-gray-900 dark:text-white leading-snug">{group.name}</h2>

              <div className="space-y-2 text-[13px]">
                {group.teacher && (
                  <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <GraduationCap className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    O&apos;qituvchi: <span className="font-medium text-[#5E2CA5] dark:text-purple-400">{group.teacher.fullName}</span>
                  </p>
                )}
                <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Wallet className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  Narx: <span className="font-medium text-gray-900 dark:text-white">{money(group.course?.price ?? null)} so&apos;m</span>
                </p>
                {(group.timeFrom || group.timeTo) && (
                  <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    Vaqt: {group.timeFrom || "?"}–{group.timeTo || "?"}
                  </p>
                )}
                {group.course && (
                  <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <BookOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    Kurs: {group.course.name}
                  </p>
                )}
                <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  Boshlanish sanasi: {fmtDate(group.startDate)}
                </p>
                <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  Tugash sanasi: {fmtDate(group.endDate)}
                </p>
                {group.room && (
                  <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    Xona: {group.room}
                  </p>
                )}
                <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <CalendarCheck className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  O&apos;tilgan darslar: {group.lessonsHeld}
                </p>
                {daysList.length > 0 && (
                  <p className="text-gray-500 dark:text-gray-400">
                    Dars kunlari: <span className="text-gray-700 dark:text-gray-300">{daysList.map(dayLabel).join(", ")}</span>
                  </p>
                )}
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                  Talabalar ({group.leads.length})
                </p>
              </div>
              <div className="px-4 pb-2 flex flex-wrap gap-x-3 gap-y-1">
                {STATUS_LEGEND.map((s) => (
                  <span key={s.key} className="flex items-center gap-1 text-[10px] text-gray-400">
                    <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", STATUS_DOT[s.key])} />
                    {s.label}
                  </span>
                ))}
              </div>
              <div className="divide-y divide-gray-50 dark:divide-white/5 max-h-[420px] overflow-y-auto">
                {group.leads.length === 0 ? (
                  <p className="px-4 py-6 text-center text-[12px] text-gray-400">A&apos;zolar yo&apos;q</p>
                ) : group.leads.map((s, idx) => (
                  <Link
                    key={s.id}
                    href={`/leads/${s.id}`}
                    className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <span className="w-4 text-[11px] text-gray-300 dark:text-gray-600 flex-shrink-0">{idx + 1}</span>
                    <span className={cn("w-2 h-2 rounded-full flex-shrink-0", STATUS_DOT[s.statusTag])} />
                    <span className="flex-1 min-w-0 text-[12.5px] font-medium text-gray-800 dark:text-gray-200 truncate">{s.fullName}</span>
                    <span className="text-[11px] text-gray-400 font-mono flex-shrink-0">{formatPhone(s.phone)}</span>
                    <MoreVertical className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </Card>
          </div>

          {/* ── Right: tabs + content ── */}
          <div className="flex-1 min-w-0 w-full space-y-4">
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
              {(tab === "attendance" || tab === "scores" || tab === "exercises" || tab === "ranking") && (
                <MonthPicker value={month} onChange={(e) => setMonth(e.target.value)} className="bg-white dark:bg-gray-900" />
              )}
            </div>

            {tab === "attendance" && <AttendanceTab groupId={groupId} month={month} />}
            {tab === "scores" && <ScoresTab groupId={groupId} month={month} />}
            {tab === "exercises" && <ExercisesTab groupId={groupId} month={month} />}
            {tab === "discount" && (
              <DiscountTab
                groupId={groupId}
                students={group.leads.map((l) => ({ id: l.id, fullName: l.fullName, discountPercent: l.discountPercent }))}
                onSaved={load}
              />
            )}
            {tab === "ranking" && <RankingTab groupId={groupId} month={month} />}
            {tab === "exams" && <ExamsTab groupId={groupId} />}
            {tab === "history" && <TarixTab groupId={groupId} />}
            {tab === "notes" && <NotesTab groupId={groupId} initialNotes={group.notes || ""} />}
          </div>
        </div>
      )}
    </div>
  );
}
