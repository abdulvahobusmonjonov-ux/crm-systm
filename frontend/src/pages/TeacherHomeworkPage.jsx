import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Search, ClipboardList, CheckCircle2, Circle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Modal, ModalPrimaryButton, ModalSecondaryButton } from "@/components/ui/modal";
import { DatePicker } from "@/components/ui/date-picker";
import { cn, formatDateUz, formatDateTime, getInitials } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
const fieldCls = "px-3 py-2 text-[13px] border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 focus:border-[#5E2CA5]/50 transition";
export default function TeacherHomeworkPage() {
    const [exercises, setExercises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("all");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [search, setSearch] = useState("");
    const [grading, setGrading] = useState(null);
    const [gradeForm, setGradeForm] = useState({ grade: "", teacherNote: "" });
    const [saving, setSaving] = useState(false);
    const load = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (status !== "all")
            params.set("status", status);
        if (from)
            params.set("from", from);
        if (to)
            params.set("to", to);
        if (search.trim())
            params.set("search", search.trim());
        const data = await apiFetch(`/api/teacher/homework?${params}`).then((r) => r.json());
        setExercises(Array.isArray(data?.exercises) ? data.exercises : []);
        setLoading(false);
    }, [status, from, to, search]);
    useEffect(() => {
        const t = setTimeout(load, 200);
        return () => clearTimeout(t);
    }, [load]);
    const openGrade = (s) => {
        setGrading(s);
        setGradeForm({ grade: s.grade?.toString() ?? "", teacherNote: s.teacherNote ?? "" });
    };
    const saveGrade = async (markChecked) => {
        if (!grading)
            return;
        setSaving(true);
        const res = await apiFetch(`/api/teacher/homework/${grading.id}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                status: markChecked ? "checked" : grading.status,
                grade: gradeForm.grade ? Number(gradeForm.grade) : null,
                teacherNote: gradeForm.teacherNote || null,
            }),
        });
        if (res.ok) {
            toast.success("Saqlandi");
            setGrading(null);
            load();
        }
        else
            toast.error("Saqlanmadi");
        setSaving(false);
    };
    const totalSubmissions = exercises.reduce((a, e) => a + e.submissions.length, 0);
    return (<div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Uy vazifalari</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{loading ? "Yuklanmoqda..." : `${totalSubmissions} ta topshiriq`}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 rounded-xl p-1">
          {["all", "unchecked", "checked"].map((s) => (<button key={s} onClick={() => setStatus(s)} className={cn("px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors", status === s ? "bg-white dark:bg-gray-800 text-[#5E2CA5] shadow-sm" : "text-gray-500 dark:text-gray-400")}>
              {s === "all" ? "Barchasi" : s === "unchecked" ? "Tekshirilmagan" : "Tekshirilgan"}
            </button>))}
        </div>
        <DatePicker value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Dan" className={fieldCls}/>
        <DatePicker value={to} onChange={(e) => setTo(e.target.value)} placeholder="Gacha" className={fieldCls}/>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="O'quvchi ismi..." className="w-full pl-9 pr-4 py-2 text-[13px] border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 focus:border-[#5E2CA5]/50 transition"/>
        </div>
      </div>

      {loading ? (<div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl bg-white dark:bg-gray-900 shadow-sm animate-pulse"/>)}
        </div>) : exercises.length === 0 ? (<Card className="py-16 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-[#5E2CA5]/10 flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-[#5E2CA5]"/>
          </div>
          <p className="text-gray-700 dark:text-gray-200 font-medium text-sm">Topshiriqlar yo&apos;q</p>
        </Card>) : (<div className="space-y-4">
          {exercises.map((ex) => (<Card key={ex.id} className="overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="text-[14px] font-bold text-gray-900 dark:text-white">{ex.title}</h3>
                  <p className="text-[12px] text-gray-400 mt-0.5">{ex.group?.name || "—"} · {formatDateUz(ex.date)}</p>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#5E2CA5]/10 text-[#5E2CA5]">
                  {ex.submissions.length} ta topshiriq
                </span>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-white/5">
                {ex.submissions.map((s) => (<button key={s.id} onClick={() => openGrade(s)} className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: "#5E2CA5" }}>
                      {getInitials(s.lead.fullName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{s.lead.fullName}</p>
                      <p className="text-[11px] text-gray-400 truncate">{formatDateTime(s.submittedAt)}</p>
                    </div>
                    {s.grade !== null && (<span className="text-[12px] font-bold text-gray-700 dark:text-gray-300 flex-shrink-0">{s.grade}</span>)}
                    {s.status === "checked" ? (<span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5"/> Tekshirilgan
                      </span>) : (<span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex-shrink-0">
                        <Circle className="w-3.5 h-3.5"/> Tekshirilmagan
                      </span>)}
                  </button>))}
              </div>
            </Card>))}
        </div>)}

      {grading && (<Modal title={grading.lead.fullName} subtitle="Topshiriqni baholash" onClose={() => setGrading(null)} footer={<>
              <ModalPrimaryButton onClick={() => saveGrade(true)} loading={saving}>Tekshirildi deb belgilash</ModalPrimaryButton>
              <ModalSecondaryButton onClick={() => saveGrade(false)}>Faqat saqlash</ModalSecondaryButton>
            </>}>
          {grading.content && (<div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 text-[13px] text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {grading.content}
            </div>)}
          <div>
            <label className="block text-[11px] font-medium text-gray-400 dark:text-gray-500 mb-1.5">Ball (0-100)</label>
            <input type="number" min={0} max={100} value={gradeForm.grade} onChange={(e) => setGradeForm((f) => ({ ...f, grade: e.target.value }))} className="w-full px-3 py-2 text-[13px] border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 focus:border-[#5E2CA5]/50 transition"/>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-400 dark:text-gray-500 mb-1.5">Izoh</label>
            <textarea value={gradeForm.teacherNote} onChange={(e) => setGradeForm((f) => ({ ...f, teacherNote: e.target.value }))} rows={3} className="w-full px-3 py-2 text-[13px] border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 focus:border-[#5E2CA5]/50 transition resize-none"/>
          </div>
        </Modal>)}
    </div>);
}
