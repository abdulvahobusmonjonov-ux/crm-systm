"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Download, LayoutGrid, DoorOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { WEEKDAYS } from "@/lib/constants";
import { UZ_MONTHS } from "@/lib/utils";

const BRAND = "#5E2CA5";

interface Group {
  id: string; name: string; days: string | null; timeFrom: string | null; timeTo: string | null;
  room: string | null; course: { name: string; color: string | null } | null; teacher: { fullName: string } | null;
  _count?: { leads: number };
}

interface TimeSlotSetting {
  id: string; startTime: string; endTime: string; label: string; isActive: boolean;
}

const GRID_DAYS = WEEKDAYS.filter((d) => d.value !== "Sun");

const DAY_NAMES: Record<string, string> = {
  Mon: "Dushanba", Tue: "Seshanba", Wed: "Chorshanba", Thu: "Payshanba", Fri: "Juma", Sat: "Shanba", Sun: "Yakshanba",
};

const ODD_DAYS = ["Mon", "Wed", "Fri"];
const EVEN_DAYS = ["Tue", "Thu", "Sat"];

type DayTab = { key: string; label: string; days: string[] };

const DAY_TABS: DayTab[] = [
  { key: "odd", label: "Toq kunlar", days: ODD_DAYS },
  { key: "even", label: "Juft kunlar", days: EVEN_DAYS },
  ...GRID_DAYS.map((d) => ({ key: d.value, label: DAY_NAMES[d.value], days: [d.value] })),
];

type ViewMode = "group" | "room";

function hexAlpha(hex: string, alpha: string) {
  return hex.startsWith("#") ? `${hex}${alpha}` : hex;
}

function getWeekRange(offset: number) {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = (day === 0 ? -6 : 1 - day) + offset * 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);
  // Deterministic formatting (no Intl/locale data) — toLocaleDateString("uz-UZ", ...)
  // renders differently between Node's SSR ICU data and the browser's, which caused
  // a hydration mismatch that wiped the <html class="dark"> the theme toggle sets.
  const fmt = (d: Date) => `${d.getDate()}-${UZ_MONTHS[d.getMonth()]}`;
  return `${fmt(monday)} – ${fmt(saturday)}`;
}

function groupDays(g: Group): string[] {
  return (g.days || "").split(",").map((s) => s.trim()).filter(Boolean);
}

function lessonLabel(g: Group): string {
  const parts = [g.course?.name, g.teacher?.fullName, `${g.timeFrom || ""}${g.timeTo ? `-${g.timeTo}` : ""}`];
  const count = g._count?.leads ?? 0;
  parts.push(`${count} o'quvchi`);
  return `${g.name}: ${parts.filter(Boolean).join(", ")}`;
}

function csvEscape(cell: string): string {
  return `"${cell.replace(/"/g, '""')}"`;
}

function downloadCSV(filename: string, rows: string[][]) {
  const csv = "﻿" + rows.map((r) => r.map(csvEscape).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TimetablePage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupFilter, setGroupFilter] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("group");
  const [dayTab, setDayTab] = useState<string>("odd");
  const [standardTimes, setStandardTimes] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/groups?limit=500").then((r) => r.json()).then((d) => { setGroups(Array.isArray(d?.groups) ? d.groups : []); setLoading(false); });
  }, []);

  useEffect(() => {
    fetch("/api/timeslots").then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setStandardTimes(d.filter((s: TimeSlotSetting) => s.isActive).map((s: TimeSlotSetting) => s.startTime));
    }).catch(() => {});
  }, []);

  const filteredGroups = useMemo(
    () => (groupFilter ? groups.filter((g) => g.id === groupFilter) : groups),
    [groups, groupFilter]
  );

  const byDay = (dayVal: string) =>
    filteredGroups
      .filter((g) => groupDays(g).includes(dayVal))
      .sort((a, b) => (a.timeFrom || "").localeCompare(b.timeFrom || ""));

  const timeSlots = useMemo(() => {
    const set = new Set<string>(standardTimes);
    filteredGroups.forEach((g) => { if (g.timeFrom) set.add(g.timeFrom); });
    return Array.from(set).sort();
  }, [filteredGroups, standardTimes]);

  const rooms = useMemo(() => {
    const set = new Set<string>();
    filteredGroups.forEach((g) => { if (g.room) set.add(g.room); });
    return Array.from(set).sort();
  }, [filteredGroups]);

  const activeDayTab = DAY_TABS.find((t) => t.key === dayTab) || DAY_TABS[0];
  const groupGridDays = GRID_DAYS.filter((d) => activeDayTab.days.includes(d.value));

  const byRoom = (room: string, time: string) =>
    filteredGroups.filter(
      (g) => g.room === room && g.timeFrom === time && groupDays(g).some((d) => activeDayTab.days.includes(d))
    );

  const groupOptions = [
    { value: "", label: "Barcha guruhlar" },
    ...groups.map((g) => ({ value: g.id, label: g.name })),
  ];

  const handleExport = () => {
    if (viewMode === "group") {
      const header = ["Vaqt", ...groupGridDays.map((d) => DAY_NAMES[d.value])];
      const rowsCsv = timeSlots.map((time) => [
        time,
        ...groupGridDays.map((d) =>
          byDay(d.value).filter((g) => g.timeFrom === time).map(lessonLabel).join(" | ")
        ),
      ]);
      downloadCSV(`dars-jadvali-guruh-${activeDayTab.key}.csv`, [header, ...rowsCsv]);
    } else {
      const header = ["Vaqt", ...rooms];
      const rowsCsv = timeSlots.map((time) => [
        time,
        ...rooms.map((room) => byRoom(room, time).map(lessonLabel).join(" | ")),
      ]);
      downloadCSV(`dars-jadvali-xona-${activeDayTab.key}.csv`, [header, ...rowsCsv]);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="shrink-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">Dars jadvali</h1>
          <div className="flex items-center gap-1 mt-2.5">
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              className="p-1 -ml-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{getWeekRange(weekOffset)}</span>
            <button
              onClick={() => setWeekOffset((w) => w + 1)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors shrink-0"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl bg-gray-100 dark:bg-white/5 p-1 shrink-0">
            <button
              onClick={() => setViewMode("group")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                viewMode === "group" ? "bg-[#5E2CA5] text-white" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Guruh
            </button>
            <button
              onClick={() => setViewMode("room")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                viewMode === "room" ? "bg-[#5E2CA5] text-white" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              <DoorOpen className="w-3.5 h-3.5" /> Xona
            </button>
          </div>
          <div className="w-48 shrink-0">
            <Select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              options={groupOptions}
            />
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-150 shrink-0"
          >
            <Download className="w-4 h-4" /> Excelga eksport
          </button>
          <button
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium text-white shadow-sm transition-colors duration-150 shrink-0"
            style={{ backgroundColor: BRAND }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#4a2280")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BRAND)}
          >
            <Plus className="w-4 h-4" /> Dars qo&apos;shish
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {DAY_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setDayTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              dayTab === t.key
                ? "bg-[#5E2CA5]/10 dark:bg-[#5E2CA5]/20 border-[#5E2CA5] text-[#5E2CA5]"
                : "border-transparent text-gray-500 dark:text-gray-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-20">Yuklanmoqda...</div>
      ) : viewMode === "group" ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[840px]">
              <thead>
                <tr>
                  <th className="w-24 p-3 text-left text-xs font-medium text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-white/5">
                    Vaqt
                  </th>
                  {groupGridDays.map((d) => (
                    <th
                      key={d.value}
                      className="p-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-l border-gray-100 dark:border-white/5 uppercase tracking-wide"
                    >
                      {DAY_NAMES[d.value]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.length === 0 ? (
                  <tr>
                    <td colSpan={groupGridDays.length + 1} className="p-12 text-center text-sm text-gray-400">
                      Darslar topilmadi
                    </td>
                  </tr>
                ) : (
                  timeSlots.map((time) => (
                    <tr key={time}>
                      <td className="p-3 text-xs font-medium text-gray-400 dark:text-gray-500 align-top border-b border-gray-100 dark:border-white/5 whitespace-nowrap">
                        {time}
                      </td>
                      {groupGridDays.map((d) => {
                        const lessons = byDay(d.value).filter((g) => g.timeFrom === time);
                        return (
                          <td
                            key={d.value}
                            className="p-2 align-top border-b border-l border-gray-100 dark:border-white/5"
                          >
                            <div className="space-y-1.5">
                              {lessons.map((g) => {
                                const color = g.course?.color || "#6366f1";
                                const count = g._count?.leads ?? 0;
                                return (
                                  <div
                                    key={g.id}
                                    title={g.teacher ? g.teacher.fullName : undefined}
                                    className="rounded-lg px-2.5 py-1.5 text-xs"
                                    style={{ backgroundColor: hexAlpha(color, "17"), borderLeft: `3px solid ${color}` }}
                                  >
                                    <p className="font-semibold truncate" style={{ color }}>
                                      {g.name}{g.room ? ` / ${g.room}` : ""}
                                    </p>
                                    {(g.timeFrom || g.timeTo || count > 0) && (
                                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                        {g.timeFrom}{g.timeTo ? `–${g.timeTo}` : ""}{count > 0 ? ` · ${count} o'quvchi` : ""}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[840px]">
              <thead>
                <tr>
                  <th className="w-32 p-3 text-left text-xs font-medium text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-white/5">
                    Xona
                  </th>
                  {timeSlots.map((time) => (
                    <th
                      key={time}
                      className="p-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-l border-gray-100 dark:border-white/5 uppercase tracking-wide whitespace-nowrap"
                    >
                      {time}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rooms.length === 0 || timeSlots.length === 0 ? (
                  <tr>
                    <td colSpan={timeSlots.length + 1} className="p-12 text-center text-sm text-gray-400">
                      Xonalar topilmadi
                    </td>
                  </tr>
                ) : (
                  rooms.map((room) => (
                    <tr key={room}>
                      <td className="p-3 text-xs font-semibold text-gray-600 dark:text-gray-300 align-top border-b border-gray-100 dark:border-white/5 whitespace-nowrap">
                        {room}
                      </td>
                      {timeSlots.map((time) => {
                        const lessons = byRoom(room, time);
                        return (
                          <td
                            key={time}
                            className="p-2 align-top border-b border-l border-gray-100 dark:border-white/5"
                          >
                            <div className="space-y-1.5 min-w-[160px]">
                              {lessons.map((g) => {
                                const color = g.course?.color || "#6366f1";
                                const count = g._count?.leads ?? 0;
                                return (
                                  <div
                                    key={g.id}
                                    className="rounded-lg px-2.5 py-1.5 text-xs"
                                    style={{ backgroundColor: hexAlpha(color, "17"), borderLeft: `3px solid ${color}` }}
                                  >
                                    <p className="font-semibold truncate" style={{ color }}>
                                      {g.course?.name || g.name}
                                    </p>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                      {g.teacher?.fullName || "—"}
                                    </p>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                      {g.timeFrom}{g.timeTo ? `–${g.timeTo}` : ""} · {count} o&apos;quvchi
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
