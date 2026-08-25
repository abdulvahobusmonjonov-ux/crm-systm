"use client";

import { useState, useEffect } from "react";
import { Download, ScrollText } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";

const BRAND = "#5E2CA5";

const ACTIONS: Record<string, string> = {
  payment_created: "To'lov qabul qilindi",
  payment_deleted: "To'lovni o'chirdi",
  lead_created: "Lid qo'shildi",
  lead_deleted: "Lidni o'chirdi",
  lead_status_changed: "Holat o'zgardi",
  lead_stage_changed: "Holat o'zgardi",
  expense_created: "Xarajat qo'shdi",
  expense_deleted: "Xarajatni o'chirdi",
  login: "Kirish",
};

// Badge color resolved by keyword — robust to unlisted action types
function actionBadgeCls(action: string): string {
  if (action.includes("payment_created")) return "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  if (action.includes("status") || action.includes("stage")) return "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400";
  if (action.includes("lead_created")) return "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400";
  if (action.includes("expense") || action.includes("deleted")) return "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400";
  if (action.includes("login")) return "bg-gray-100 dark:bg-white/8 text-gray-600 dark:text-gray-400";
  return "bg-[#5E2CA5]/10 text-[#5E2CA5]";
}

const TH = "px-4 py-3 text-left text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide whitespace-nowrap";

interface AuditLogEntry {
  id: string;
  createdAt: string;
  userName: string | null;
  action: string;
  entity: string | null;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/logs").then(r => r.json()).then(d => { setLogs(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const exportCSV = () => {
    const header = ["Vaqt", "Foydalanuvchi", "Amal", "Tafsilot"];
    const rows = logs.map(l => [
      new Date(l.createdAt).toLocaleString("ru-RU"),
      l.userName || "—",
      ACTIONS[l.action] || l.action,
      l.entity || "",
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `jurnallar_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Jurnallar</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Kim, qachon, nima qildi</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium bg-[#5E2CA5] hover:bg-[#4a2280] text-white shadow-sm transition-colors"
        >
          <Download className="w-4 h-4" /> Eksport
        </button>
      </div>

      {/* Table card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[13px] text-gray-400 animate-pulse">Yuklanmoqda...</div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center">
            <ScrollText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-[13px] text-gray-400">Yozuv yo&apos;q</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5">
                  <th className={TH}>Vaqt</th>
                  <th className={TH}>Foydalanuvchi</th>
                  <th className={TH}>Amal</th>
                  <th className={TH}>Tafsilot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {logs.map(l => (
                  <tr key={l.id} className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors duration-100">

                    {/* Vaqt */}
                    <td className="px-4 py-3 text-[13px] text-gray-500 dark:text-gray-400 whitespace-nowrap tabular-nums">
                      {new Date(l.createdAt).toLocaleString("ru-RU")}
                    </td>

                    {/* Foydalanuvchi */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                          style={{ backgroundColor: BRAND }}
                        >
                          {l.userName ? getInitials(l.userName) : "?"}
                        </div>
                        <span className="text-[13px] font-medium text-gray-900 dark:text-white truncate">
                          {l.userName || "—"}
                        </span>
                      </div>
                    </td>

                    {/* Amal — rangli badge */}
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap",
                        actionBadgeCls(l.action)
                      )}>
                        {ACTIONS[l.action] || l.action}
                      </span>
                    </td>

                    {/* Tafsilot */}
                    <td className="px-4 py-3 text-[13px] text-gray-500 dark:text-gray-400 max-w-[280px] truncate">
                      {l.entity || <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
