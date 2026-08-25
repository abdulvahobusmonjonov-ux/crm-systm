"use client";

import { useState, useEffect } from "react";
import { Trophy } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";

const BRAND = "#5E2CA5";

type Period = "week" | "month" | "all";

const PERIODS: { key: Period; label: string }[] = [
  { key: "week",  label: "Hafta"   },
  { key: "month", label: "Oy"      },
  { key: "all",   label: "Hammasi" },
];

const MEDAL = [
  { border: "#f59e0b", bg: "#fef3c7", text: "#92400e", label: "🥇", shadow: "shadow-amber-200 dark:shadow-amber-900/40"  },
  { border: "#94a3b8", bg: "#f1f5f9", text: "#475569", label: "🥈", shadow: "shadow-slate-200 dark:shadow-slate-700/40"   },
  { border: "#cd7f32", bg: "#fef3e2", text: "#92400e", label: "🥉", shadow: "shadow-orange-200 dark:shadow-orange-900/40" },
];

// podium order: 2nd – 1st – 3rd
const PODIUM_ORDER = [1, 0, 2];
const PODIUM_HEIGHT = ["h-28", "h-40", "h-24"]; // 2nd, 1st, 3rd
const PODIUM_AVATAR = ["w-14 h-14", "w-20 h-20", "w-12 h-12"];

const AVATAR_COLORS = [BRAND, "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#f97316", "#ef4444"];
function avatarColor(name: string) {
  return AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
}

interface LeaderboardEntry {
  id: string;
  fullName: string;
  coins: number | null;
  group: { name: string } | null;
  course: { name: string } | null;
}

export default function LeaderboardPage() {
  const [list, setList] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("all");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?period=${period}`)
      .then(r => r.json())
      .then(d => { setList(Array.isArray(d) ? d : []); setLoading(false); });
  }, [period]);

  const top3   = list.slice(0, 3);
  const rest   = list.slice(3, 10);

  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-5 sm:space-y-6" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Reyting</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Tanga bo&apos;yicha o&apos;quvchilar reytingi</p>
        </div>

        {/* Period segment */}
        <div className="flex gap-0.5 bg-white dark:bg-gray-900 p-1 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                "px-4 py-1.5 text-[13px] font-medium rounded-lg transition-colors duration-150",
                period === p.key
                  ? "bg-[#5E2CA5] text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        /* Skeleton */
        <div className="space-y-4">
          <div className="flex items-end justify-center gap-4 h-52">
            {[1,0,2].map(i => (
              <div key={i} className={cn("bg-white dark:bg-gray-900 rounded-2xl animate-pulse w-36", i === 0 ? "h-48" : i === 1 ? "h-36" : "h-28")} />
            ))}
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm h-64 animate-pulse" />
        </div>
      ) : list.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm py-20 text-center">
          <Trophy className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-[13px] text-gray-500 font-medium">Hali tanga berilmagan</p>
          <p className="text-[12px] text-gray-400 mt-1">Davomat va imtihon natijalariga qarab tanga beriladi</p>
        </div>
      ) : (
        <>
          {/* ── Podium ── */}
          {top3.length >= 1 && (
            <div className="flex items-end justify-center gap-3 pt-4 pb-2">
              {PODIUM_ORDER.map((rankIdx, col) => {
                const student = top3[rankIdx];
                if (!student) return <div key={col} className="w-36" />;

                const medal = MEDAL[rankIdx];
                const isFirst = rankIdx === 0;

                return (
                  <div
                    key={col}
                    className="flex flex-col items-center gap-2 select-none"
                  >
                    {/* Avatar with medal ring */}
                    <div className="relative">
                      <div
                        className={cn(
                          "rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ring-4",
                          PODIUM_AVATAR[col],
                          isFirst ? "text-xl" : rankIdx === 1 ? "text-base" : "text-sm"
                        )}
                        style={{
                          backgroundColor: avatarColor(student.fullName),
                          boxShadow: `0 0 0 4px ${medal.border}`,
                        }}
                      >
                        {getInitials(student.fullName)}
                      </div>
                      {/* Medal badge */}
                      <span
                        className="absolute -bottom-1 -right-1 text-base leading-none"
                        style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))" }}
                      >
                        {medal.label}
                      </span>
                    </div>

                    {/* Name */}
                    <div className="text-center max-w-[120px]">
                      <p className={cn(
                        "font-bold text-gray-900 dark:text-white leading-tight truncate",
                        isFirst ? "text-[14px]" : "text-[12px]"
                      )}>
                        {student.fullName.split(" ")[0]}
                      </p>
                      {student.group?.name && (
                        <p className="text-[10px] text-gray-400 truncate">{student.group.name}</p>
                      )}
                    </div>

                    {/* Podium block */}
                    <div
                      className={cn(
                        "w-32 rounded-t-2xl flex flex-col items-center justify-center gap-1 shadow-lg",
                        PODIUM_HEIGHT[col]
                      )}
                      style={{ backgroundColor: medal.bg, borderTop: `3px solid ${medal.border}` }}
                    >
                      <span className="text-2xl font-black" style={{ color: medal.border }}>
                        {rankIdx + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5" style={{ color: medal.border }} />
                        <span className="text-[13px] font-bold" style={{ color: medal.text }}>
                          {student.coins ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Rest of the list (4–10) ── */}
          {rest.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 dark:border-white/5">
                <h2 className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  4–{Math.min(10, list.length)} o&apos;rin
                </h2>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-white/5">
                {rest.map((student, idx) => {
                  const rank = idx + 4;
                  const color = avatarColor(student.fullName);
                  return (
                    <div
                      key={student.id}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors duration-100"
                    >
                      {/* Rank */}
                      <div className="w-7 flex-shrink-0 text-center">
                        <span className="text-[14px] font-bold text-gray-400 dark:text-gray-500 tabular-nums">
                          {rank}
                        </span>
                      </div>

                      {/* Avatar */}
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                        style={{ backgroundColor: color }}
                      >
                        {getInitials(student.fullName)}
                      </div>

                      {/* Name + group */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">
                          {student.fullName}
                        </p>
                        {(student.group?.name || student.course?.name) && (
                          <p className="text-[11px] text-gray-400 truncate">
                            {student.group?.name || student.course?.name}
                          </p>
                        )}
                      </div>

                      {/* Coins */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center">
                          <Trophy className="w-3.5 h-3.5 text-amber-500" />
                        </div>
                        <span className="text-[14px] font-bold text-gray-700 dark:text-gray-200 tabular-nums">
                          {student.coins ?? 0}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* If only top3 and no rest */}
          {list.length > 0 && rest.length === 0 && list.length <= 3 && (
            <p className="text-center text-[12px] text-gray-400 pb-2">
              Jami {list.length} ta ishtirokchi
            </p>
          )}
        </>
      )}
    </div>
  );
}
