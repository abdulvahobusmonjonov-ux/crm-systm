"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Trophy, Wallet, Users, MapPin, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { WEEKDAYS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Group {
  id: string;
  name: string;
  room: string | null;
  days: string | null;
  course: { name: string; color: string | null } | null;
  _count: { leads: number };
}

const JS_DAY_TO_VALUE = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const dayLabel = (v: string) => WEEKDAYS.find((d) => d.value === v)?.label || v;

export default function TeacherDashboardPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "today">("all");

  useEffect(() => {
    fetch("/api/teacher/dashboard")
      .then((r) => r.json())
      .then((d) => setGroups(Array.isArray(d?.groups) ? d.groups : []))
      .finally(() => setLoading(false));
  }, []);

  const todayValue = JS_DAY_TO_VALUE[new Date().getDay()];

  const filtered = useMemo(() => {
    if (filter === "all") return groups;
    return groups.filter((g) => (g.days ? g.days.split(",").includes(todayValue) : false));
  }, [groups, filter, todayValue]);

  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Asosiy</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">O&apos;qituvchi paneli</p>
      </div>

      {/* Top cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#A657F2]/10 flex items-center justify-center flex-shrink-0">
            <Trophy className="w-5 h-5 text-[#A657F2]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">Reyting</p>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500">
                Tez kunda
              </span>
            </div>
            <p className="text-lg font-bold text-gray-300 dark:text-gray-600 mt-0.5">—</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center flex-shrink-0">
            <Wallet className="w-5 h-5 text-[#7C3AED]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">Oylik</p>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500">
                Tez kunda
              </span>
            </div>
            <p className="text-lg font-bold text-gray-300 dark:text-gray-600 mt-0.5 tracking-widest">*****</p>
          </div>
        </Card>
      </div>

      {/* Groups */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-[15px] font-bold text-gray-900 dark:text-white">Guruhlar</h2>
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 rounded-xl p-1">
            {(["all", "today"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors",
                  filter === f ? "bg-white dark:bg-gray-800 text-[#5E2CA5] shadow-sm" : "text-gray-500 dark:text-gray-400"
                )}
              >
                {f === "all" ? "Barchasi" : "Bugun"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-5 space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-[#5E2CA5]/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-[#5E2CA5]" />
            </div>
            <p className="text-gray-700 dark:text-gray-200 font-medium text-sm">
              {filter === "today" ? "Bugun darsingiz yo'q" : "Sizga biriktirilgan guruh yo'q"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-white/5">
                  <th className="px-5 py-3 font-medium">Guruh nomi</th>
                  <th className="px-5 py-3 font-medium hidden sm:table-cell">Kurs</th>
                  <th className="px-5 py-3 font-medium">O&apos;quvchilar</th>
                  <th className="px-5 py-3 font-medium hidden sm:table-cell">Xona</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((g) => (
                  <tr key={g.id} className="border-b last:border-0 border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link href={`/teacher/groups/${g.id}`} className="text-[13px] font-semibold text-gray-900 dark:text-white hover:text-[#5E2CA5] transition-colors">
                        {g.name}
                      </Link>
                      <div className="flex items-center gap-1.5 mt-1 sm:hidden text-[11px] text-gray-400">
                        <BookOpen className="w-3 h-3" /> {g.course?.name || "—"}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell text-[13px] text-gray-500 dark:text-gray-400">
                      {g.course?.name || "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#5E2CA5]/8 text-[#5E2CA5]">
                        <Users className="w-3 h-3" /> {g._count.leads}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell text-[13px] text-gray-500 dark:text-gray-400">
                      {g.room ? (
                        <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gray-400" />{g.room}</span>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
