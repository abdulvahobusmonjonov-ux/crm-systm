import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "@/lib/router";
import Link from "@/components/ui/link";
import { ArrowLeft, Phone, MessageCircle, BookOpen, Users, Wallet, CalendarCheck, GraduationCap, Coins, } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from "@/lib/constants";
import { formatDate, formatPhone, phoneToTel, phoneToTelegram, getInitials } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
const BRAND = "#5E2CA5";
export default function StudentDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [student, setStudent] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("payments");
    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [leadRes, paymentsRes] = await Promise.all([
                apiFetch(`/api/leads/${id}`),
                apiFetch(`/api/payments?leadId=${id}&limit=200`),
            ]);
            if (!leadRes.ok) {
                router.push("/students");
                return;
            }
            const leadData = await leadRes.json();
            setStudent(leadData);
            if (paymentsRes.ok) {
                const paymentsData = await paymentsRes.json().catch(() => ({}));
                setPayments(paymentsData.payments || []);
            }
            else {
                setPayments([]);
            }
        }
        catch {
            // Tarmoq/server xatosi bo'lsa ham sahifa "crash" bo'lmasin — bo'sh holatda qoladi,
            // foydalanuvchi qayta urinib ko'rishi mumkin.
            setStudent(null);
        }
        finally {
            setLoading(false);
        }
    }, [id, router]);
    useEffect(() => { load(); }, [load]);
    if (loading) {
        return (<div className="p-3 sm:p-4 lg:p-6 space-y-4">
        <div className="h-32 bg-white dark:bg-gray-900 rounded-2xl shadow-sm animate-pulse"/>
        <div className="h-80 bg-white dark:bg-gray-900 rounded-2xl shadow-sm animate-pulse"/>
      </div>);
    }
    if (!student)
        return null;
    const totalPaid = payments.reduce((a, p) => a + Number(p.amount || 0), 0);
    const att = student.attendances || [];
    const present = att.filter((a) => a.status === "present").length;
    const absent = att.filter((a) => a.status === "absent").length;
    const late = att.filter((a) => a.status === "late").length;
    const attTotal = present + absent + late;
    const attPct = attTotal > 0 ? Math.round(((present + late) / attTotal) * 100) : null;
    const statusCls = LEAD_STATUS_COLORS[student.status] || "";
    const tabs = [
        { key: "payments", label: "To'lovlar", icon: Wallet },
        { key: "attendance", label: "Davomat", icon: CalendarCheck },
        { key: "scores", label: "Ballar", icon: GraduationCap },
    ];
    return (<div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6">
      <div className="max-w-4xl mx-auto space-y-4" style={{ fontFamily: "'Inter', sans-serif" }}>

        {/* Profile card */}
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <Link href="/students" className="inline-flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-3">
              <ArrowLeft className="w-3.5 h-3.5"/> O&apos;quvchilar
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#5E2CA5]/10 text-[#5E2CA5] flex items-center justify-center text-xl font-bold flex-shrink-0">
                {getInitials(student.fullName)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">{student.fullName}</h1>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusCls}`}>
                    {LEAD_STATUS_LABELS[student.status] || student.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-2 flex-wrap text-sm">
                  <a href={phoneToTel(student.phone)} className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 hover:text-[#5E2CA5] transition-colors">
                    <Phone className="w-3.5 h-3.5"/> {formatPhone(student.phone)}
                  </a>
                  <a href={phoneToTelegram(student.phone)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 hover:text-[#5E2CA5] transition-colors">
                    <MessageCircle className="w-3.5 h-3.5"/> Telegram
                  </a>
                </div>
                <div className="flex items-center gap-4 mt-1.5 flex-wrap text-sm">
                  {student.course && (<span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                      <BookOpen className="w-3.5 h-3.5"/>
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: student.course.color || BRAND }}/>
                      {student.course.name}
                    </span>)}
                  {student.group ? (<span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                      <Users className="w-3.5 h-3.5"/> {student.group.name}
                    </span>) : (<span className="flex items-center gap-1.5 text-gray-400">
                      <Users className="w-3.5 h-3.5"/> Guruhga qo&apos;shilmagan
                    </span>)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <Wallet className="w-5 h-5 text-emerald-600"/>
            </div>
            <div className="min-w-0">
              <p className="text-[12px] text-gray-400 mb-0.5">Jami to&apos;lov</p>
              <p className="text-[18px] font-bold text-gray-900 dark:text-white leading-tight truncate">{totalPaid.toLocaleString("ru-RU")} so&apos;m</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#5E2CA5]/10 flex items-center justify-center flex-shrink-0">
              <CalendarCheck className="w-5 h-5 text-[#5E2CA5]"/>
            </div>
            <div>
              <p className="text-[12px] text-gray-400 mb-0.5">Davomat foizi</p>
              <p className="text-[18px] font-bold text-gray-900 dark:text-white leading-tight">{attPct !== null ? `${attPct}%` : "—"}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <Coins className="w-5 h-5 text-amber-500"/>
            </div>
            <div>
              <p className="text-[12px] text-gray-400 mb-0.5">Tanga balansi</p>
              <p className="text-[18px] font-bold text-gray-900 dark:text-white leading-tight">{student.coins ?? 0}</p>
            </div>
          </div>
        </div>

        {/* Tabs card */}
        <Card className="rounded-2xl shadow-sm">
          <div className="flex border-b border-gray-100 dark:border-white/10 px-4 overflow-x-auto">
            {tabs.map((t) => {
            const Icon = t.icon;
            return (<button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.key ? "border-[#5E2CA5] text-[#5E2CA5]" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
                  <Icon className="w-4 h-4"/> {t.label}
                </button>);
        })}
          </div>
          <CardContent>
            {tab === "payments" && (<div className="space-y-1.5">
                {payments.map((p) => (<div key={p.id} className="flex items-center justify-between text-sm px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5">
                    <span className="text-gray-500">
                      {new Date(p.paidAt).toLocaleDateString("ru-RU")}{p.forMonth ? ` · ${p.forMonth}` : ""}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">{Number(p.amount).toLocaleString("ru-RU")} so&apos;m</span>
                  </div>))}
                {payments.length === 0 && <p className="text-center text-gray-400 py-8">To&apos;lovlar yo&apos;q</p>}
              </div>)}

            {tab === "attendance" && (<div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-800/40 text-center">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{present}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Keldi</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-800/40 text-center">
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{late}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Kechikdi</p>
                  </div>
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-800/40 text-center">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{absent}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Kelmadi</p>
                  </div>
                </div>
                {attTotal > 0 && (<div className="h-2 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden flex">
                    <div className="bg-emerald-500 h-full" style={{ width: `${(present / attTotal) * 100}%` }}/>
                    <div className="bg-amber-500 h-full" style={{ width: `${(late / attTotal) * 100}%` }}/>
                    <div className="bg-red-500 h-full" style={{ width: `${(absent / attTotal) * 100}%` }}/>
                  </div>)}
                {attTotal === 0 && <p className="text-center text-gray-400 py-8">Davomat ma&apos;lumoti yo&apos;q</p>}
              </div>)}

            {tab === "scores" && (<div className="space-y-1.5">
                {(student.scores || []).map((s) => (<div key={s.id} className="flex items-center justify-between text-sm px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5">
                    <span className="text-gray-600 dark:text-gray-300 truncate">{s.exam?.title || "—"} · {formatDate(s.createdAt)}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{s.score}{s.exam?.maxScore ? `/${s.exam.maxScore}` : ""}</span>
                  </div>))}
                {(student.scores || []).length === 0 && <p className="text-center text-gray-400 py-8">Ballar yo&apos;q</p>}
              </div>)}
          </CardContent>
        </Card>
      </div>
    </div>);
}
