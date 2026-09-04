"use client";

import { useState, useEffect, useCallback } from "react";
import { Wallet } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface StudentFinance {
  leadId: string; fullName: string; totalPaid: number; paymentCount: number; lastPaymentAt: string | null;
}
interface FinanceData { monthlyPrice: number; students: StudentFinance[]; }

function money(v: number) { return Number(v || 0).toLocaleString("ru-RU"); }

export default function FinanceTab({ groupId }: { groupId: string }) {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/teacher/groups/${groupId}/finance`);
      if (!res.ok) { setError(true); setLoading(false); return; }
      setData(await res.json());
    } catch {
      setError(true);
    }
    setLoading(false);
  }, [groupId]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-3">
      {data && (
        <div className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <Wallet className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[11px] text-gray-400">Oylik to&apos;lov (kurs narxi)</p>
            <p className="text-[16px] font-bold text-gray-900 dark:text-white">{money(data.monthlyPrice)} so&apos;m</p>
          </div>
        </div>
      )}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[13px] text-gray-400 animate-pulse">Yuklanmoqda...</div>
        ) : error ? (
          <div className="py-16 text-center text-[13px] text-red-500">Ma&apos;lumotni yuklab bo&apos;lmadi. Sahifani yangilab ko&apos;ring.</div>
        ) : !data || data.students.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-gray-400">O&apos;quvchi yo&apos;q</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">O&apos;quvchi</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Jami to&apos;langan</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wide">To&apos;lovlar soni</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Oxirgi to&apos;lov</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Holat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {data.students.map((s) => {
                  const debt = data.monthlyPrice - s.totalPaid;
                  return (
                    <tr key={s.leadId} className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors duration-100">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 bg-[#5E2CA5]">
                            {getInitials(s.fullName)}
                          </div>
                          <span className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{s.fullName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-[14px] font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {money(s.totalPaid)} so&apos;m
                      </td>
                      <td className="px-4 py-3 text-right text-[13px] text-gray-500 dark:text-gray-400">{s.paymentCount}</td>
                      <td className="px-4 py-3 text-[13px] text-gray-400 whitespace-nowrap">
                        {s.lastPaymentAt ? new Date(s.lastPaymentAt).toLocaleDateString("ru-RU") : <span className="text-gray-300">Hech qachon</span>}
                      </td>
                      <td className="px-4 py-3">
                        {data.monthlyPrice > 0 && debt > 0 ? (
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400 whitespace-nowrap">
                            Qarz: {money(debt)}
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                            To&apos;langan
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
