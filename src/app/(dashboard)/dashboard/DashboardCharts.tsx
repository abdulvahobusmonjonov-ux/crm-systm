"use client";

import { Clock } from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { LEAD_SOURCE_LABELS } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/utils";

const BRAND = "#5E2CA5";

interface RecentActivity {
  id: string; action: string; createdAt: string;
  user: { fullName: string } | null;
  lead: { fullName: string } | null;
}
interface DashboardData {
  kpis: { totalLeads: number; todayLeads: number; enrolledThisMonth: number; todayReminders: number; conversionRate: string };
  stageDistribution: { stageId: string; name: string; color: string; count: number }[];
  sourceDistribution: { source: string; count: number }[];
  leadsByDay: { date: string; count: number }[];
  topCourses: { courseId: string; course: { name: string; color: string } | null; count: number }[];
  recentActivities: RecentActivity[];
}

function getInitial(name: string) { return name?.charAt(0)?.toUpperCase() ?? "?"; }

function activityLabel(action: string): string {
  const map: Record<string, string> = {
    lead_created: "yangi lid qo'shdi",
    status_changed: "statusni o'zgartirdi",
    note_added: "izoh qo'shdi",
    reminder_created: "eslatma yaratdi",
    called: "qo'ng'iroq qildi",
    lead_updated: "ma'lumotni yangiladi",
    lead_deleted: "lidni o'chirdi",
  };
  return map[action] ?? action;
}

export default function DashboardCharts({ data }: { data: DashboardData }) {
  const activeStages = data.stageDistribution.filter(s => s.count > 0);

  return (
    <>
      {/* Row 1: Sources + Stages + Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Manbalar</h2>
          <p className="text-xs text-gray-400 mb-4">Qayerdan kelmoqda</p>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={data.sourceDistribution} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis
                dataKey="source" type="category"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                width={80} axisLine={false} tickLine={false}
                tickFormatter={v => (LEAD_SOURCE_LABELS as Record<string, string>)[v] ?? v}
              />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", fontSize: 12 }}
                cursor={{ fill: "#f5f3ff" }}
                formatter={v => [v, "Lidlar"]}
              />
              <Bar dataKey="count" name="Lidlar" fill={BRAND} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Bosqich taqsimoti</h2>
          <p className="text-xs text-gray-400 mb-4">Lidlar holati</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={activeStages} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                {activeStages.map(entry => (
                  <Cell key={entry.stageId} fill={entry.color || "#9ca3af"} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", fontSize: 12 }}
                formatter={(v, n) => [v, n]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5">
            {activeStages.slice(0, 4).map(s => (
              <div key={s.stageId} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-[10px] text-gray-500 dark:text-gray-400">{s.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Top kurslar</h2>
          <p className="text-xs text-gray-400 mb-4">Eng ko&apos;p tanlanganlar</p>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart
              data={data.topCourses.map(c => ({ name: c.course?.name ?? "Noma'lum", count: c.count }))}
              margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", fontSize: 12 }}
                cursor={{ fill: "#f5f3ff" }}
              />
              <Bar dataKey="count" name="Lidlar" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity feed */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">So&apos;nggi faollik</h2>
            <p className="text-xs text-gray-400 mt-0.5">Tizimda bo&apos;lgan amallar</p>
          </div>
          <Clock className="w-4 h-4 text-gray-300 dark:text-gray-600" />
        </div>
        <div className="divide-y divide-gray-50 dark:divide-white/5 max-h-72 overflow-y-auto">
          {data.recentActivities.map(act => (
            <div key={act.id} className="flex items-start gap-3 px-6 py-3">
              <div className="mt-0.5 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[10px] font-semibold" style={{ backgroundColor: BRAND }}>
                {getInitial(act.user?.fullName ?? "?")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-gray-700 dark:text-gray-300">
                  <span className="font-medium text-gray-900 dark:text-white">{act.user?.fullName}</span>{" "}
                  <span className="text-gray-400">{activityLabel(act.action)}</span>
                  {act.lead && (
                    <span>
                      {" — "}
                      <span className="text-[#5E2CA5] dark:text-purple-400">{act.lead.fullName}</span>
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">{formatRelativeTime(act.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
