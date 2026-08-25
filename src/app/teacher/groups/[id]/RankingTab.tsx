"use client";

import { useState, useEffect, useCallback } from "react";
import { Trophy } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface RankRow { leadId: string; fullName: string; value: number; }

const MEDAL = ["🥇", "🥈", "🥉"];
const AVATAR_COLORS = ["#5E2CA5", "#7C3AED", "#A657F2", "#0EA5E9", "#F59E0B", "#10B981", "#EF4444"];
const avatarColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

export default function RankingTab({ groupId, month }: { groupId: string; month: string }) {
  const [metric, setMetric] = useState<"score" | "coin">("score");
  const [mode, setMode] = useState<"avg" | "total">("avg");
  const [ranking, setRanking] = useState<RankRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({ month, metric, mode });
      const res = await fetch(`/api/teacher/groups/${groupId}/ranking?${params}`);
      if (!res.ok) { setError(true); setLoading(false); return; }
      const data = await res.json();
      setRanking(data.ranking || []);
    } catch {
      setError(true);
    }
    setLoading(false);
  }, [groupId, month, metric, mode]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 rounded-xl p-1">
          {(["score", "coin"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors",
                metric === m ? "bg-white dark:bg-gray-800 text-[#5E2CA5] shadow-sm" : "text-gray-500 dark:text-gray-400"
              )}
            >
              {m === "score" ? "Ballar" : "Kristall"}
            </button>
          ))}
        </div>
        {metric === "score" && (
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 rounded-xl p-1">
            {(["avg", "total"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors",
                  mode === m ? "bg-white dark:bg-gray-800 text-[#5E2CA5] shadow-sm" : "text-gray-500 dark:text-gray-400"
                )}
              >
                {m === "avg" ? "O'rta arifmetik" : "Umumiy"}
              </button>
            ))}
          </div>
        )}
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[13px] text-gray-400 animate-pulse">Yuklanmoqda...</div>
        ) : error ? (
          <div className="py-16 text-center text-[13px] text-red-500">Ma&apos;lumotni yuklab bo&apos;lmadi. Sahifani yangilab ko&apos;ring.</div>
        ) : ranking.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-gray-400">Ma&apos;lumot yo&apos;q</div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-white/5">
            {ranking.map((r, idx) => (
              <div key={r.leadId} className="flex items-center gap-3 px-5 py-3">
                <span className="w-7 text-center text-[13px] font-bold text-gray-400 dark:text-gray-500 flex-shrink-0">
                  {idx < 3 ? <span className="text-lg">{MEDAL[idx]}</span> : idx + 1}
                </span>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                  style={{ backgroundColor: avatarColor(r.fullName) }}
                >
                  {getInitials(r.fullName)}
                </div>
                <span className="flex-1 min-w-0 text-[13px] font-medium text-gray-900 dark:text-white truncate">{r.fullName}</span>
                <span className="flex items-center gap-1.5 text-[13px] font-bold text-gray-700 dark:text-gray-200 flex-shrink-0">
                  {metric === "coin" && <Trophy className="w-3.5 h-3.5 text-amber-500" />}
                  {r.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
