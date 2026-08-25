"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowLeft, Phone, MessageCircle, BookOpen, Users, Wallet,
  CalendarCheck, GraduationCap, Coins,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from "@/lib/constants";
import { formatDate, formatPhone, phoneToTel, phoneToTelegram, getInitials } from "@/lib/utils";

interface Payment { id: string; amount: string | number; paidAt: string; forMonth: string | null; method: string; }
interface Score { id: string; score: number; exam: { title: string; maxScore: number } | null; createdAt: string; }

interface Student {
  id: string;
  fullName: string;
  phone: string | null;
  status: string;
  coins: number;
  course: { id: string; name: string; color: string | null } | null;
  group: { id: string; name: string; days: string | null; timeFrom: string | null; timeTo: string | null } | null;
  attendances: { status: string }[];
  scores: Score[];
}

type Tab = "payments" | "attendance" | "scores";

const BRAND = "#5E2CA5";

export default function TeacherStudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const isAdminRole = session?.user?.role === "SUPER_ADMIN" || session?.user?.role === "ADMIN";
  const showPayments = isAdminRole || !!session?.user?.canSeePayments;
  const showContacts = isAdminRole || !!session?.user?.canSeeStudentContacts;
  const [student, setStudent] = useState<Student | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("attendance");

  const load = useCallback(async () => {
    setLoading(true);
    const leadRes = await fetch(`/api/teacher/students/${id}`);
    if (!leadRes.ok) { router.push("/teacher/students"); return; }
    const leadData = await leadRes.json();
    setStudent(leadData);
    if (showPayments) {
      const paymentsRes = await fetch(`/api/teacher/students/${id}/payments`);
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setPayments(paymentsData.payments || []);
      }
    }
    setLoading(false);
  }, [id, router, showPayments]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!showPayments && tab === "payments") setTab("attendance");
  }, [showPayments, tab]);

  if (loading) {
    return (
      <div className="p-3 sm:p-4 lg:p-6 space-y-4">
        <div className="h-32 bg-white dark:bg-gray-900 rounded-2xl shadow-sm animate-pulse" />
        <div className="h-80 bg-white dark:bg-gray-900 rounded-2xl shadow-sm animate-pulse" />
      </div>
    );
  }
  if (!student) return null;

  const totalPaid = payments.reduce((a, p) => a + Number(p.amount || 0), 0);
  const att = student.attendances || [];
  const present = att.filter((a) => a.status === "present").length;
  const absent = att.filter((a) => a.status === "absent").length;
  const excused = att.filter((a) => a.status === "excused").length;
  const attTotal = present + absent + excused;
  const attPct = attTotal > 0 ? Math.round(((present + excused) / attTotal) * 100) : null;
  const statusCls = LEAD_STATUS_COLORS[student.status as keyof typeof LEAD_STATUS_COLORS] || "";

  const tabs: { key: Tab; label: string; icon: typeof Wallet }[] = [
    ...(showPayments ? [{ key: "payments" as const, label: "To'lovlar", icon: Wallet }] : []),
    { key: "attendance", label: "Davomat", icon: CalendarCheck },
    { key: "scores", label: "Ballar", icon: GraduationCap },
  ];

  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6">
      <div className="max-w-4xl mx-auto space-y-4" style={{ fontFamily: "'Inter', sans-serif" }}>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <Link href="/teacher/students" className="inline-flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-3">
              <ArrowLeft className="w-3.5 h-3.5" /> O&apos;quvchilar
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#5E2CA5]/10 text-[#5E2CA5] flex items-center justify-center text-xl font-bold flex-shrink-0">
                {getInitials(student.fullName)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">{student.fullName}</h1>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusCls}`}>
                    {LEAD_STATUS_LABELS[student.status as keyof typeof LEAD_STATUS_LABELS] || student.status}
                  </span>
                </div>
                {showContacts && student.phone && (
                  <div className="flex items-center gap-4 mt-2 flex-wrap text-sm">
                    <a href={phoneToTel(student.phone)} className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 hover:text-[#5E2CA5] transition-colors">
                      <Phone className="w-3.5 h-3.5" /> {formatPhone(student.phone)}
                    </a>
                    <a href={phoneToTelegram(student.phone)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 hover:text-[#5E2CA5] transition-colors">
                      <MessageCircle className="w-3.5 h-3.5" /> Telegram
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-4 mt-1.5 flex-wrap text-sm">
                  {student.course && (
                    <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: student.course.color || BRAND }} />
                      {student.course.name}
                    </span>
                  )}
                  {student.group ? (
                    <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                      <Users className="w-3.5 h-3.5" /> {student.group.name}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-gray-400">
                      <Users className="w-3.5 h-3.5" /> Guruhga qo&apos;shilmagan
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className={`grid grid-cols-1 gap-4 ${showPayments ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          {showPayments && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <Wallet className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] text-gray-400 mb-0.5">Jami to&apos;lov</p>
                <p className="text-[18px] font-bold text-gray-900 dark:text-white leading-tight truncate">{totalPaid.toLocaleString("ru-RU")} so&apos;m</p>
              </div>
            </div>
          )}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#5E2CA5]/10 flex items-center justify-center flex-shrink-0">
              <CalendarCheck className="w-5 h-5 text-[#5E2CA5]" />
            </div>
            <div>
              <p className="text-[12px] text-gray-400 mb-0.5">Davomat foizi</p>
              <p className="text-[18px] font-bold text-gray-900 dark:text-white leading-tight">{attPct !== null ? `${attPct}%` : "—"}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <Coins className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-[12px] text-gray-400 mb-0.5">Tanga balansi</p>
              <p className="text-[18px] font-bold text-gray-900 dark:text-white leading-tight">{student.coins ?? 0}</p>
            </div>
          </div>
        </div>

        <Card className="rounded-2xl shadow-sm">
          <div className="flex border-b border-gray-100 dark:border-white/10 px-4 overflow-x-auto">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    tab === t.key ? "border-[#5E2CA5] text-[#5E2CA5]" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" /> {t.label}
                </button>
              );
            })}
          </div>
          <CardContent>
            {tab === "payments" && (
              <div className="space-y-1.5">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5">
                    <span className="text-gray-500">
                      {new Date(p.paidAt).toLocaleDateString("ru-RU")}{p.forMonth ? ` · ${p.forMonth}` : ""}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">{Number(p.amount).toLocaleString("ru-RU")} so&apos;m</span>
                  </div>
                ))}
                {payments.length === 0 && <p className="text-center text-gray-400 py-8">To&apos;lovlar yo&apos;q</p>}
              </div>
            )}

            {tab === "attendance" && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-800/40 text-center">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{present}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Keldi</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-800/40 text-center">
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{excused}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Sababli</p>
                  </div>
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-800/40 text-center">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{absent}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Kelmadi</p>
                  </div>
                </div>
                {attTotal > 0 && (
                  <div className="h-2 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden flex">
                    <div className="bg-emerald-500 h-full" style={{ width: `${(present / attTotal) * 100}%` }} />
                    <div className="bg-amber-500 h-full" style={{ width: `${(excused / attTotal) * 100}%` }} />
                    <div className="bg-red-500 h-full" style={{ width: `${(absent / attTotal) * 100}%` }} />
                  </div>
                )}
                {attTotal === 0 && <p className="text-center text-gray-400 py-8">Davomat ma&apos;lumoti yo&apos;q</p>}
              </div>
            )}

            {tab === "scores" && (
              <div className="space-y-1.5">
                {(student.scores || []).map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-sm px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5">
                    <span className="text-gray-600 dark:text-gray-300 truncate">{s.exam?.title || "—"} · {formatDate(s.createdAt)}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{s.score}{s.exam?.maxScore ? `/${s.exam.maxScore}` : ""}</span>
                  </div>
                ))}
                {(student.scores || []).length === 0 && <p className="text-center text-gray-400 py-8">Ballar yo&apos;q</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
