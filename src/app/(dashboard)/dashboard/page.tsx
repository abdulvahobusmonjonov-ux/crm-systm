"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  Users, TrendingUp, TrendingDown, Bell, GraduationCap,
  CalendarCheck, CreditCard, PauseCircle, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface Kpis {
  totalLeads: number;
  leadsThisMonth: number;
  leadsLastMonth: number;
  todayLeads: number;
  yesterdayLeads: number;
  enrolledThisMonth: number;
  enrolledLastMonth: number;
  todayReminders: number;
  yesterdayReminders: number;
  trialBookedAll: number;
  trialBookedThisMonth: number;
  trialBookedLastMonth: number;
  paidThisMonth: number;
  paidLastMonth: number;
  paidThisMonthAmount: number;
  frozen: number;
  debtors: number;
  conversionRate: string;
}

interface DashboardData {
  kpis: Kpis;
  stageDistribution: { stageId: string; name: string; color: string; count: number }[];
  sourceDistribution: { source: string; count: number }[];
  leadsByDay: { date: string; count: number }[];
  topCourses: { courseId: string; course: { name: string; color: string } | null; count: number }[];
  recentLeads: { id: string; fullName: string; course: { name: string } | null; stage: { name: string; color: string } | null }[];
  recentActivities: { id: string; action: string; createdAt: string; user: { fullName: string } | null; lead: { fullName: string } | null }[];
}

interface KpiCardDef {
  label: string;
  value: number;
  sub?: string;
  icon: LucideIcon;
  chipBg: string;
  chipColor: string;
  delta?: number;
  deltaLabel?: string;
  staticBadge?: string;
}

function fmtAmount(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

function GrowthBadge({ delta, label }: { delta?: number; label?: string }) {
  if (delta === undefined) return null;
  if (delta > 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full whitespace-nowrap">
        <TrendingUp className="w-2.5 h-2.5" /> +{delta}
        {label && <span className="font-normal opacity-70 ml-0.5">{label}</span>}
      </span>
    );
  if (delta < 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full whitespace-nowrap">
        <TrendingDown className="w-2.5 h-2.5" /> {delta}
        {label && <span className="font-normal opacity-70 ml-0.5">{label}</span>}
      </span>
    );
  return (
    <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-full whitespace-nowrap">
      → 0
    </span>
  );
}

function StaticBadge({ label }: { label: string }) {
  return (
    <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-full whitespace-nowrap">
      {label}
    </span>
  );
}

const ChartsSkeleton = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map(i => <div key={i} className="h-64 bg-white dark:bg-gray-900 rounded-2xl animate-pulse" />)}
    </div>
    <div className="h-48 bg-white dark:bg-gray-900 rounded-2xl animate-pulse" />
  </div>
);

const DashboardCharts = dynamic(() => import("./DashboardCharts"), {
  ssr: false,
  loading: ChartsSkeleton,
});

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard").then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 bg-white dark:bg-gray-900 rounded-2xl animate-pulse" />
          ))}
        </div>
        <ChartsSkeleton />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Ma&apos;lumot yuklanmadi</p>
      </div>
    );
  }

  const { kpis } = data;

  const kpiCards: KpiCardDef[] = [
    {
      label: "Yangi lidlar (bu oy)",
      value: kpis.leadsThisMonth,
      icon: Users,
      chipBg: "bg-[#5E2CA5]/10 dark:bg-[#5E2CA5]/20",
      chipColor: "text-[#5E2CA5]",
      delta: kpis.leadsThisMonth - kpis.leadsLastMonth,
      deltaLabel: "vs oy",
    },
    {
      label: "Bu oy yozilganlar",
      value: kpis.enrolledThisMonth,
      sub: `${kpis.conversionRate}% konversiya`,
      icon: GraduationCap,
      chipBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
      chipColor: "text-emerald-600 dark:text-emerald-400",
      delta: kpis.enrolledThisMonth - kpis.enrolledLastMonth,
      deltaLabel: "vs oy",
    },
    {
      label: "Bugungi yangi lidlar",
      value: kpis.todayLeads,
      icon: TrendingUp,
      chipBg: "bg-amber-500/10 dark:bg-amber-500/20",
      chipColor: "text-amber-600 dark:text-amber-400",
      delta: kpis.todayLeads - kpis.yesterdayLeads,
      deltaLabel: "vs kecha",
    },
    {
      label: "Bugungi qo'ng'iroqlar",
      value: kpis.todayReminders,
      icon: Bell,
      chipBg: "bg-sky-500/10 dark:bg-sky-500/20",
      chipColor: "text-sky-600 dark:text-sky-400",
      delta: kpis.todayReminders - kpis.yesterdayReminders,
      deltaLabel: "vs kecha",
    },
    {
      label: "Sinov darsida",
      value: kpis.trialBookedAll,
      sub: `bu oy: +${kpis.trialBookedThisMonth}`,
      icon: CalendarCheck,
      chipBg: "bg-violet-500/10 dark:bg-violet-500/20",
      chipColor: "text-violet-600 dark:text-violet-400",
      delta: kpis.trialBookedThisMonth - kpis.trialBookedLastMonth,
      deltaLabel: "vs oy",
    },
    {
      label: "Shu oy to'laganlar",
      value: kpis.paidThisMonth,
      sub: kpis.paidThisMonthAmount > 0 ? `${fmtAmount(kpis.paidThisMonthAmount)} so'm` : undefined,
      icon: CreditCard,
      chipBg: "bg-green-500/10 dark:bg-green-500/20",
      chipColor: "text-green-600 dark:text-green-400",
      delta: kpis.paidThisMonth - kpis.paidLastMonth,
      deltaLabel: "vs oy",
    },
    {
      label: "Muzlatilganlar",
      value: kpis.frozen,
      icon: PauseCircle,
      chipBg: "bg-cyan-500/10 dark:bg-cyan-500/20",
      chipColor: "text-cyan-600 dark:text-cyan-400",
      staticBadge: "Hozirgi holat",
    },
    {
      label: "Qarzdorlar (bu oy)",
      value: kpis.debtors,
      icon: AlertCircle,
      chipBg: "bg-red-500/10 dark:bg-red-500/20",
      chipColor: "text-red-600 dark:text-red-400",
      staticBadge: "To'lamagan",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-5 sm:space-y-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Bugungi holat va statistika</p>
      </div>

      {/* KPI Grid: 2 rows × 4 cols */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {kpiCards.map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-1">
                <div className={cn("w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0", kpi.chipBg)}>
                  <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", kpi.chipColor)} />
                </div>
                {kpi.delta !== undefined
                  ? <GrowthBadge delta={kpi.delta} label={kpi.deltaLabel} />
                  : <StaticBadge label={kpi.staticBadge ?? "—"} />
                }
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-none tabular-nums">
                  {kpi.value.toLocaleString("ru-RU")}
                </p>
                {kpi.sub && (
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">{kpi.sub}</p>
                )}
                <p className="text-[11px] sm:text-xs text-gray-400 dark:text-gray-500 mt-1.5 leading-tight">{kpi.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts + feeds (lazy loaded — recharts bundle split) */}
      <DashboardCharts data={data} />
    </div>
  );
}
