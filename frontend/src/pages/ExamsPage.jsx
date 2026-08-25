import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Trash2, ArrowLeft, Save, ClipboardList, BookOpen, Calendar, Users, TrendingUp, } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { useConfirm } from "@/components/ui/confirm";
import { Modal, ModalPrimaryButton, ModalSecondaryButton } from "@/components/ui/modal";
import { cn, getInitials } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
const BRAND = "#5E2CA5";
function ymd(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function grade(score, max) {
    if (score === null || score === undefined)
        return "—";
    const p = (score / max) * 100;
    if (p >= 90)
        return "A+";
    if (p >= 80)
        return "A";
    if (p >= 70)
        return "B";
    if (p >= 60)
        return "C";
    return "F";
}
const GRADE_CLS = {
    "A+": "bg-[#5E2CA5]/10 text-[#5E2CA5] dark:bg-[#5E2CA5]/20",
    "A": "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
    "B": "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
    "C": "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
    "F": "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
    "—": "bg-gray-100 text-gray-400 dark:bg-white/8 dark:text-gray-500",
};
function examStatus(e) {
    const d = new Date(e.date);
    d.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if ((e._count?.scores ?? 0) > 0)
        return { label: "Bajarildi", cls: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" };
    if (d > now)
        return { label: "Kutilmoqda", cls: "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400" };
    if (d.getTime() === now.getTime())
        return { label: "Bugun", cls: "bg-[#5E2CA5]/10 dark:bg-[#5E2CA5]/20 text-[#5E2CA5]" };
    return { label: "O'tib ketdi", cls: "bg-gray-100 dark:bg-white/8 text-gray-500 dark:text-gray-400" };
}
const fieldCls = "w-full px-3 py-2 text-[13px] border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 focus:border-[#5E2CA5]/50 transition";
const labelCls = "block text-[11px] font-medium text-gray-400 dark:text-gray-500 mb-1.5";
const TH = "px-4 py-3 text-left text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide whitespace-nowrap";
export default function ExamsPage() {
    const { confirm, dialog } = useConfirm();
    const [exams, setExams] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ title: "", type: "exam", groupId: "", courseId: "", date: ymd(new Date()), maxScore: "100" });
    const [saving, setSaving] = useState(false);
    const [selected, setSelected] = useState(null);
    const load = useCallback(async () => {
        setLoading(true);
        const res = await apiFetch("/api/exams");
        setExams(await res.json());
        setLoading(false);
    }, []);
    useEffect(() => { load(); }, [load]);
    useEffect(() => {
        apiFetch("/api/groups?limit=500").then(r => r.json()).then(d => setGroups(Array.isArray(d?.groups) ? d.groups : []));
    }, []);
    const create = async () => {
        if (!form.title.trim()) {
            toast.error("Nom kiriting");
            return;
        }
        setSaving(true);
        const res = await apiFetch("/api/exams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        setSaving(false);
        if (res.ok) {
            toast.success("Yaratildi");
            setShowAdd(false);
            setForm({ title: "", type: "exam", groupId: "", courseId: "", date: ymd(new Date()), maxScore: "100" });
            load();
        }
        else
            toast.error("Saqlab bo'lmadi");
    };
    const del = async (id) => {
        if (!(await confirm({ title: "Imtihonni o'chirish", message: "Bu imtihon va uning ballarini o'chirasizmi?" })))
            return;
        const res = await apiFetch(`/api/exams/${id}`, { method: "DELETE" });
        if (res.ok) {
            toast.success("O'chirildi");
            load();
        }
        else
            toast.error("O'chirib bo'lmadi");
    };
    if (selected)
        return <ScoreEntry exam={selected} onBack={() => { setSelected(null); load(); }} dialog={dialog}/>;
    return (<div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      {dialog}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Imtihonlar</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Imtihon va daraja testlari, ballar</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium bg-[#5E2CA5] hover:bg-[#4a2280] text-white shadow-sm transition-colors">
          <Plus className="w-4 h-4"/> Yangi imtihon
        </button>
      </div>

      {/* Exam cards grid */}
      {loading ? (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl h-48 animate-pulse"/>)}
        </div>) : exams.length === 0 ? (<div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm py-20 text-center">
          <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3"/>
          <p className="text-[13px] text-gray-500 font-medium">Imtihon yo&apos;q</p>
          <button onClick={() => setShowAdd(true)} className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium bg-[#5E2CA5] text-white mx-auto hover:bg-[#4a2280] transition-colors">
            <Plus className="w-4 h-4"/> Imtihon yaratish
          </button>
        </div>) : (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map(e => {
                const status = examStatus(e);
                const isLevelTest = e.type === "level_test";
                const Icon = isLevelTest ? BookOpen : ClipboardList;
                const iconBg = isLevelTest ? "bg-blue-500/10" : "bg-[#5E2CA5]/10";
                const iconColor = isLevelTest ? "#3b82f6" : BRAND;
                return (<div key={e.id} onClick={() => setSelected(e)} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer flex flex-col overflow-hidden group">
                <div className="p-5 flex-1">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", iconBg)}>
                      <Icon className="w-5 h-5" style={{ color: iconColor }}/>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", status.cls)}>
                        {status.label}
                      </span>
                      <button onClick={ev => { ev.stopPropagation(); del(e.id); }} className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-3.5 h-3.5"/>
                      </button>
                    </div>
                  </div>

                  {/* Exam type badge */}
                  <span className="inline-block text-[10px] font-semibold uppercase tracking-wide mb-1.5 px-2 py-0.5 rounded-full" style={{ backgroundColor: iconColor + "18", color: iconColor }}>
                    {isLevelTest ? "Daraja testi" : "Imtihon"}
                  </span>

                  {/* Title */}
                  <h3 className="text-[15px] font-bold text-gray-900 dark:text-white leading-snug group-hover:text-[#5E2CA5] transition-colors">
                    {e.title}
                  </h3>
                  {e.group && (<p className="text-[12px] text-gray-400 mt-0.5 truncate">{e.group.name}</p>)}
                </div>

                {/* Divider */}
                <div className="mx-5 border-t border-gray-100 dark:border-white/5"/>

                {/* Stats row */}
                <div className="px-5 py-3 grid grid-cols-3 gap-2">
                  <div>
                    <div className="flex items-center gap-1 text-gray-400 mb-0.5">
                      <Calendar className="w-3 h-3"/>
                      <span className="text-[10px] uppercase tracking-wide font-medium">Sana</span>
                    </div>
                    <p className="text-[12px] font-semibold text-gray-700 dark:text-gray-200 tabular-nums">
                      {new Date(e.date).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-gray-400 mb-0.5">
                      <Users className="w-3 h-3"/>
                      <span className="text-[10px] uppercase tracking-wide font-medium">O&apos;quvchi</span>
                    </div>
                    <p className="text-[12px] font-semibold text-gray-700 dark:text-gray-200">
                      {e._count?.scores ?? 0}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-gray-400 mb-0.5">
                      <TrendingUp className="w-3 h-3"/>
                      <span className="text-[10px] uppercase tracking-wide font-medium">O&apos;rtacha</span>
                    </div>
                    <p className="text-[12px] font-semibold text-gray-700 dark:text-gray-200">
                      {e.averageScore != null ? `${Math.round(e.averageScore)}%` : "—"}
                    </p>
                  </div>
                </div>
              </div>);
            })}
        </div>)}

      {/* Create modal */}
      {showAdd && (<Modal title="Yangi imtihon" onClose={() => setShowAdd(false)} footer={<>
              <ModalPrimaryButton onClick={create} loading={saving}>Yaratish</ModalPrimaryButton>
              <ModalSecondaryButton onClick={() => setShowAdd(false)}>Bekor qilish</ModalSecondaryButton>
            </>}>
            <Input label="Nom" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="1-modul imtihoni"/>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Turi</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={fieldCls}>
                  <option value="exam">Imtihon</option>
                  <option value="level_test">Daraja testi</option>
                </select>
              </div>
              <Input label="Maks. ball" type="number" value={form.maxScore} onChange={e => setForm(f => ({ ...f, maxScore: e.target.value }))}/>
            </div>
            <div>
              <label className={labelCls}>Guruh</label>
              <select value={form.groupId} onChange={e => setForm(f => ({ ...f, groupId: e.target.value }))} className={fieldCls}>
                <option value="">Tanlang...</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Sana</label>
              <DatePicker value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={fieldCls}/>
            </div>
        </Modal>)}
    </div>);
}
/* ─────────────── ScoreEntry ─────────────── */
function ScoreEntry({ exam, onBack, dialog }) {
    const [students, setStudents] = useState([]);
    const [maxScore, setMaxScore] = useState(100);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        apiFetch(`/api/exams/${exam.id}/scores`).then(r => r.json()).then(d => {
            setStudents(d.students || []);
            setMaxScore(d.maxScore || 100);
            setLoading(false);
        });
    }, [exam.id]);
    const setScore = (leadId, v) => setStudents(prev => prev.map(s => s.leadId === leadId ? { ...s, score: v === "" ? null : Number(v) } : s));
    const save = async () => {
        const records = students
            .filter(s => s.score !== null && s.score !== undefined && s.score !== "")
            .map(s => ({ leadId: s.leadId, score: Number(s.score) }));
        if (!records.length) {
            toast.error("Hech bo'lmasa bittasini kiriting");
            return;
        }
        setSaving(true);
        const res = await apiFetch(`/api/exams/${exam.id}/scores`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ records }),
        });
        setSaving(false);
        if (res.ok)
            toast.success("Ballar saqlandi");
        else
            toast.error("Saqlab bo'lmadi");
    };
    // Sorted results for the ranking table
    const ranked = [...students]
        .filter(s => s.score !== null && s.score !== undefined)
        .sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));
    const unscored = students.filter(s => s.score === null || s.score === undefined);
    return (<div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      {dialog}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 text-gray-500 hover:text-[#5E2CA5] hover:border-[#5E2CA5]/30 transition-colors shadow-sm">
            <ArrowLeft className="w-4 h-4"/>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{exam.title}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{exam.group?.name || "Guruhsiz"} · maks. {maxScore} ball</p>
          </div>
        </div>
        {students.length > 0 && (<button onClick={save} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold bg-[#5E2CA5] hover:bg-[#4a2280] text-white shadow-sm transition-colors disabled:opacity-60">
            <Save className="w-4 h-4"/>
            {saving ? "Saqlanmoqda..." : "Ballarni saqlash"}
          </button>)}
      </div>

      {loading ? (<div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm py-16 text-center text-[13px] text-gray-400 animate-pulse">Yuklanmoqda...</div>) : students.length === 0 ? (<div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm py-16 text-center">
          <p className="text-[13px] text-gray-400">Bu guruhda o&apos;quvchi yo&apos;q. Imtihonga guruh biriktiring.</p>
        </div>) : (<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* ── Score input section ── */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 dark:border-white/5">
              <h2 className="text-[14px] font-semibold text-gray-900 dark:text-white">Ball kiritish</h2>
              <p className="text-[12px] text-gray-400 mt-0.5">Maksimal: {maxScore} ball</p>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-white/5">
              {students.map(s => (<div key={s.leadId} className="flex items-center justify-between gap-3 px-5 py-2.5 hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: BRAND }}>
                      {getInitials(s.fullName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{s.fullName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <input type="number" min={0} max={maxScore} value={s.score ?? ""} onChange={e => setScore(s.leadId, e.target.value)} placeholder="—" className="w-20 px-2.5 py-1.5 text-[13px] text-right border border-gray-200 dark:border-white/10 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 focus:border-[#5E2CA5]/50 transition"/>
                    <span className="text-[12px] text-gray-400 tabular-nums">/{maxScore}</span>
                  </div>
                </div>))}
            </div>
          </div>

          {/* ── Results ranking table ── */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 dark:border-white/5">
              <h2 className="text-[14px] font-semibold text-gray-900 dark:text-white">Natijalar reytingi</h2>
              <p className="text-[12px] text-gray-400 mt-0.5">{ranked.length} ta baholangan</p>
            </div>
            {ranked.length === 0 ? (<div className="py-12 text-center text-[13px] text-gray-400">Hali ball kiritilmagan</div>) : (<div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-white/5">
                      <th className={cn(TH, "w-10 text-center")}>#</th>
                      <th className={TH}>O&apos;quvchi</th>
                      <th className={cn(TH, "text-right")}>Ball</th>
                      <th className={cn(TH, "text-right")}>Foiz</th>
                      <th className={cn(TH, "text-center")}>Baho</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                    {ranked.map((s, idx) => {
                    const pct = Math.round((Number(s.score) / maxScore) * 100);
                    const g = grade(Number(s.score), maxScore);
                    const pctColor = pct >= 90 ? "text-emerald-600 dark:text-emerald-400" :
                        pct >= 70 ? "text-[#5E2CA5] dark:text-purple-400" :
                            pct >= 60 ? "text-amber-600 dark:text-amber-400" :
                                "text-red-600 dark:text-red-400";
                    return (<tr key={s.leadId} className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors">
                          {/* Rank */}
                          <td className="px-4 py-2.5 text-center">
                            {idx === 0 ? (<span className="text-base">🥇</span>) : idx === 1 ? (<span className="text-base">🥈</span>) : idx === 2 ? (<span className="text-base">🥉</span>) : (<span className="text-[12px] font-bold text-gray-400 tabular-nums">{idx + 1}</span>)}
                          </td>
                          {/* Student */}
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0" style={{ backgroundColor: BRAND }}>
                                {getInitials(s.fullName)}
                              </div>
                              <span className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{s.fullName}</span>
                            </div>
                          </td>
                          {/* Ball */}
                          <td className="px-4 py-2.5 text-right">
                            <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-200 tabular-nums">
                              {s.score}
                              <span className="text-[11px] font-normal text-gray-400">/{maxScore}</span>
                            </span>
                          </td>
                          {/* Foiz */}
                          <td className="px-4 py-2.5 text-right">
                            <span className={cn("text-[13px] font-bold tabular-nums", pctColor)}>
                              {pct}%
                            </span>
                          </td>
                          {/* Baho */}
                          <td className="px-4 py-2.5 text-center">
                            <span className={cn("inline-flex items-center justify-center text-[11px] font-bold px-2 py-0.5 rounded-lg min-w-[32px]", GRADE_CLS[g])}>
                              {g}
                            </span>
                          </td>
                        </tr>);
                })}
                    {/* Unscored students */}
                    {unscored.map(s => (<tr key={s.leadId} className="opacity-40 hover:bg-gray-50/60 dark:hover:bg-white/5">
                        <td className="px-4 py-2.5 text-center">
                          <span className="text-[12px] text-gray-400">—</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400 text-[9px] font-bold flex-shrink-0">
                              {getInitials(s.fullName)}
                            </div>
                            <span className="text-[13px] text-gray-500 truncate">{s.fullName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right text-[12px] text-gray-400">—</td>
                        <td className="px-4 py-2.5 text-right text-[12px] text-gray-400">—</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={cn("inline-flex items-center justify-center text-[11px] font-bold px-2 py-0.5 rounded-lg min-w-[32px]", GRADE_CLS["—"])}>—</span>
                        </td>
                      </tr>))}
                  </tbody>
                </table>
              </div>)}
          </div>
        </div>)}
    </div>);
}
