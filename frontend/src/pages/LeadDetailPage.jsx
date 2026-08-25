import { useState, useEffect } from "react";
import { useRouter, useParams } from "@/lib/router";
import Link from "@/components/ui/link";
import { toast } from "sonner";
import { ArrowLeft, Phone, MessageCircle, Edit, Trash2, Bell, Pin, PinOff, User, BookOpen, Activity, Check, X, Coins, Send, CalendarCheck, Wallet, GraduationCap, Plus, Minus, } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
import { useConfirm } from "@/components/ui/confirm";
import { LEAD_STATUS_LABELS, LEAD_STATUS_COLORS, LEAD_SOURCE_LABELS } from "@/lib/constants";
import { formatDate, formatDateTime, formatRelativeTime, formatPhone, phoneToTel, phoneToTelegram, phoneToWhatsapp, formatCurrency, getInitials, isPhoneComplete } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
const ACTIVITY_DOT = {
    lead_created: "bg-emerald-500",
    status_changed: "bg-[#5E2CA5]",
    comment: "bg-blue-500",
    note_added: "bg-blue-400",
    reminder_created: "bg-amber-500",
    lead_updated: "bg-gray-400",
};
export default function LeadDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [lead, setLead] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("activity");
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editData, setEditData] = useState({});
    const [newNote, setNewNote] = useState("");
    const [reminder, setReminder] = useState({ title: "", remindAt: "" });
    const [addingReminder, setAddingReminder] = useState(false);
    const [courses, setCourses] = useState([]);
    const [users, setUsers] = useState([]);
    const [, setTimeSlots] = useState([]);
    const [stages, setStages] = useState([]);
    const [botUsername, setBotUsername] = useState("");
    const load = async () => {
        const res = await apiFetch(`/api/leads/${id}`);
        if (res.ok) {
            const data = await res.json();
            setLead(data);
            setEditData(data);
        }
        else
            router.push("/leads");
        setLoading(false);
    };
    useEffect(() => { load(); }, [id]);
    useEffect(() => {
        apiFetch("/api/courses").then(r => r.json()).then(setCourses);
        apiFetch("/api/users").then(r => r.json()).then(setUsers);
        apiFetch("/api/timeslots").then(r => r.json()).then(setTimeSlots);
        apiFetch("/api/stages").then(r => r.json()).then(setStages);
        apiFetch("/api/settings?prefix=telegram_bot_username").then(r => r.json()).then(m => setBotUsername(m.telegram_bot_username || "")).catch(() => { });
    }, []);
    const notifyStudent = async () => {
        const text = prompt("O'quvchiga yuboriladigan xabar:");
        if (!text)
            return;
        const res = await apiFetch(`/api/leads/${id}/notify`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
        if (res.ok)
            toast.success("Xabar yuborildi");
        else
            toast.error((await res.json().catch(() => ({}))).error || "Yuborilmadi");
    };
    const copyStudentLink = () => {
        if (!botUsername) {
            toast.error("Avval Sozlamalar → Botni faollashtiring");
            return;
        }
        navigator.clipboard.writeText(`https://t.me/${botUsername}?start=s_${id}`).then(() => toast.success("Havola nusxalandi"), () => toast.error("Nusxalab bo'lmadi"));
    };
    const toggleFreeze = async () => {
        const frozen = !!lead?.frozenAt;
        await apiFetch(`/api/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ frozenAt: frozen ? null : new Date().toISOString() }) });
        toast.success(frozen ? "Faollashtirildi" : "Muzlatildi");
        load();
    };
    const toggleArchive = async () => {
        const arch = !!lead?.isArchived;
        if (!arch && !(await confirm({ title: "Arxivlash", message: "Bu lidni arxivlaysizmi? Ro'yxatdan yashiriladi." })))
            return;
        await apiFetch(`/api/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isArchived: !arch }) });
        toast.success(arch ? "Arxivdan chiqarildi" : "Arxivlandi");
        if (!arch)
            router.push("/leads");
        else
            load();
    };
    const giveCoins = async (sign) => {
        const v = prompt(sign > 0 ? "Necha tanga berish?" : "Necha tanga olish?");
        if (!v || Number(v) <= 0)
            return;
        const reason = prompt("Sabab:") || (sign > 0 ? "Mukofot" : "Jarima");
        const res = await apiFetch(`/api/leads/${id}/coins`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: sign * Number(v), reason }) });
        if (res.ok) {
            toast.success("Tanga yangilandi");
            load();
        }
        else
            toast.error("Xatolik");
    };
    const save = async () => {
        const parentPhone = editData.parentPhone;
        if (parentPhone && !isPhoneComplete(parentPhone)) {
            toast.error("To'liq telefon raqam kiriting");
            return;
        }
        setSaving(true);
        const res = await apiFetch(`/api/leads/${id}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editData),
        });
        if (res.ok) {
            toast.success("Saqlandi");
            setEditing(false);
            load();
        }
        else
            toast.error("Xatolik");
        setSaving(false);
    };
    const changeStage = async (stageId) => {
        const res = await apiFetch(`/api/leads/${id}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stageId }),
        });
        if (res.ok) {
            const s = stages.find((x) => x.id === stageId);
            toast.success(`Bosqich → ${s?.name || ""}`);
            load();
        }
    };
    const togglePin = async () => {
        await apiFetch(`/api/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPinned: !lead?.isPinned }) });
        load();
    };
    const addReminder = async () => {
        if (!reminder.title || !reminder.remindAt) {
            toast.error("Sarlavha va vaqt kiriting");
            return;
        }
        setAddingReminder(true);
        const res = await apiFetch("/api/reminders", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ leadId: id, ...reminder }),
        });
        if (res.ok) {
            toast.success("Eslatma qo'shildi");
            setReminder({ title: "", remindAt: "" });
            load();
        }
        setAddingReminder(false);
    };
    const saveNote = async () => {
        if (!newNote.trim())
            return;
        const res = await apiFetch("/api/leads/" + id + "/activity", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "comment", details: { text: newNote.trim() } }),
        });
        if (res.ok) {
            toast.success("Izoh qo'shildi");
            setNewNote("");
            load();
        }
        else
            toast.error("Xatolik");
    };
    const { confirm, dialog } = useConfirm();
    const deleteLead = async () => {
        if (!(await confirm({ title: "Lidni o'chirish", message: "Bu lidni o'chirishni tasdiqlaysizmi?" })))
            return;
        const res = await apiFetch(`/api/leads/${id}`, { method: "DELETE" });
        if (res.ok) {
            toast.success("Lid o'chirildi");
            router.push("/leads");
        }
        else
            toast.error("O'chirib bo'lmadi");
    };
    if (loading)
        return <div className="animate-pulse space-y-4"><div className="h-32 bg-white dark:bg-gray-900 rounded-2xl"/><div className="h-80 bg-white dark:bg-gray-900 rounded-2xl"/></div>;
    if (!lead)
        return null;
    const currentStageIdx = stages.findIndex((s) => s.id === lead.stageId);
    const total = (lead.payments || []).reduce((a, p) => a + Number(p.amount || 0), 0);
    const att = lead.attendances || [];
    const present = att.filter((a) => a.status === "present").length;
    const absent = att.filter((a) => a.status === "absent").length;
    const late = att.filter((a) => a.status === "late").length;
    const attTotal = present + absent + late;
    const statusCls = LEAD_STATUS_COLORS[lead.status] || "";
    const tabs = [
        { key: "activity", label: "Faoliyat", icon: Activity },
        { key: "reminders", label: "Eslatmalar", icon: Bell, badge: lead.reminders.filter((r) => r.status === "PENDING").length },
        { key: "payments", label: "To'lovlar", icon: Wallet },
        { key: "attendance", label: "Davomat", icon: CalendarCheck },
        { key: "scores", label: "Ballar", icon: GraduationCap },
    ];
    return (<div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6">
      <div className="max-w-6xl mx-auto space-y-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      {dialog}

      {/* Profile card */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-start gap-3 mb-2">
            <Link href="/leads" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition flex-shrink-0">
              <ArrowLeft className="w-4 h-4 text-gray-500"/>
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-[#5E2CA5]/10 text-[#5E2CA5] flex items-center justify-center text-xl font-bold flex-shrink-0">
              {getInitials(lead.fullName)}
            </div>

            {/* Name / status / contact */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{lead.fullName}</h1>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusCls}`}>
                  {LEAD_STATUS_LABELS[lead.status]}
                </span>
                {lead.isPinned && <span className="text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 px-2 py-0.5 rounded-full">📌 Pinlangan</span>}
                {lead.frozenAt && <span className="text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 px-2 py-0.5 rounded-full">❄️ Muzlatilgan</span>}
                {lead.isArchived && <span className="text-xs font-medium bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400 px-2 py-0.5 rounded-full">🗄 Arxiv</span>}
              </div>

              <div className="flex items-center gap-4 mt-1.5 flex-wrap text-sm">
                <a href={phoneToTel(lead.phone)} className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 hover:text-[#5E2CA5] transition">
                  <Phone className="w-3.5 h-3.5"/> {formatPhone(lead.phone)}
                </a>
                {lead.course && (<span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                    <BookOpen className="w-3.5 h-3.5"/>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: lead.course.color || "#5E2CA5" }}/>
                    {lead.course.name}
                  </span>)}
              </div>

              <p className="text-xs text-gray-400 mt-1.5">
                Qo&apos;shilgan: {formatDate(lead.createdAt)} · {lead.createdBy.fullName}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button onClick={togglePin} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition text-gray-500" title={lead.isPinned ? "Pindan olib tashlash" : "Pinlash"}>
                {lead.isPinned ? <PinOff className="w-4 h-4"/> : <Pin className="w-4 h-4"/>}
              </button>
              {editing ? (<>
                  <Button size="sm" variant="outline" onClick={() => setEditing(false)}><X className="w-3.5 h-3.5"/> Bekor</Button>
                  <Button size="sm" loading={saving} onClick={save} className="bg-[#5E2CA5] hover:bg-[#4e2488] text-white shadow-sm"><Check className="w-3.5 h-3.5"/> Saqlash</Button>
                </>) : (<Button size="sm" variant="outline" onClick={() => setEditing(true)}><Edit className="w-4 h-4"/> Tahrirlash</Button>)}
              <Button size="sm" variant="outline" onClick={toggleFreeze}>{lead.frozenAt ? "Faollashtirish" : "Muzlatish"}</Button>
              <Button size="sm" variant="outline" onClick={toggleArchive}>{lead.isArchived ? "Arxivdan" : "Arxivlash"}</Button>
              <Button size="sm" variant="danger" onClick={deleteLead}><Trash2 className="w-4 h-4"/></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column */}
        <div className="space-y-4">
          {/* Ma'lumotlar */}
          <Card className="rounded-2xl shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-white/10">
              <h3 className="font-semibold text-gray-900 dark:text-white text-base">Ma&apos;lumotlar</h3>
            </div>
            <CardContent className="space-y-4">
              {/* Quick contact */}
              <div className="space-y-2">
                <a href={phoneToTel(lead.phone)} className="flex items-center gap-3 p-2.5 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-800/50 rounded-xl hover:bg-green-100 dark:hover:bg-green-500/15 transition">
                  <Phone className="w-4 h-4 text-green-600"/> <span className="text-sm font-medium text-green-700 dark:text-green-400">{formatPhone(lead.phone)}</span>
                </a>
                {lead.phoneSecondary && (<a href={phoneToTel(lead.phoneSecondary)} className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition">
                    <Phone className="w-4 h-4 text-gray-500"/> <span className="text-sm text-gray-700 dark:text-gray-300">{formatPhone(lead.phoneSecondary)}</span>
                  </a>)}
                <div className="flex gap-2">
                  <a href={phoneToTelegram(lead.phone)} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/15 transition">
                    <MessageCircle className="w-3.5 h-3.5"/> Telegram
                  </a>
                  <a href={phoneToWhatsapp(lead.phone)} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-400 rounded-xl hover:bg-green-100 dark:hover:bg-green-500/15 transition">
                    <MessageCircle className="w-3.5 h-3.5"/> WhatsApp
                  </a>
                </div>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 gap-3 text-sm pt-1">
                {[
            ["Yoshi", "age", lead.age ? `${lead.age} yosh` : "—"],
            ["Manzil", "address", lead.address || "—"],
            ["Ota-ona ismi", "parentName", lead.parentName || "—"],
            ["Ota-ona tel", "parentPhone", lead.parentPhone || "—"],
            ["Manba", null, LEAD_SOURCE_LABELS[lead.source]],
            ["Manba detali", "sourceDetails", lead.sourceDetails || "—"],
            ["Dars kunlari", "preferredDays", lead.preferredDays || "—"],
            ["Dars vaqti", "lessonTime", lead.lessonTime || "—"],
            ["Yozilgan sana", null, lead.enrolledAt ? formatDate(lead.enrolledAt) : "—"],
        ].map(([label, field, value]) => (<div key={label} className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide flex-shrink-0">{label}</span>
                    {editing && field === "parentPhone" ? (<PhoneInput value={editData.parentPhone || ""} onChange={e => setEditData((d) => ({ ...d, parentPhone: e.target.value }))} className="w-44"/>) : editing && field ? (<input value={editData[field] || ""} onChange={e => setEditData((d) => ({ ...d, [field]: e.target.value }))} className="block w-32 px-2 py-1.5 text-sm border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5E2CA5] outline-none text-right"/>) : (<p className="text-gray-900 dark:text-white font-medium text-right truncate">{value}</p>)}
                  </div>))}
                {lead.assignedTo && (<div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1.5"><User className="w-3.5 h-3.5"/> Mas&apos;ul</span>
                    {editing ? (<select value={editData.assignedToId || ""} onChange={e => setEditData((d) => ({ ...d, assignedToId: e.target.value || null }))} className="w-32 px-2 py-1.5 text-sm border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5E2CA5] outline-none">
                        <option value="">Tayinlanmagan</option>
                        {users.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                      </select>) : (<p className="text-gray-900 dark:text-white font-medium text-right truncate">{lead.assignedTo.fullName}</p>)}
                  </div>)}
                {editing && (<div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Kurs</span>
                    <select value={editData.courseId || ""} onChange={e => setEditData((d) => ({ ...d, courseId: e.target.value || null }))} className="w-32 px-2 py-1.5 text-sm border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5E2CA5] outline-none">
                      <option value="">Tanlanmagan</option>
                      {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>)}
              </div>

              {/* Telegram student bot */}
              <div className="pt-3 border-t border-gray-100 dark:border-white/10">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5"><Send className="w-3.5 h-3.5"/> Telegram (o&apos;quvchi)</p>
                {lead.telegramChatId ? (<div className="space-y-2">
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">✅ Botga ulangan</p>
                    <Button size="sm" variant="outline" className="w-full" onClick={notifyStudent}>Xabar yuborish</Button>
                  </div>) : (<div className="space-y-2">
                    <p className="text-xs text-gray-500">O&apos;quvchi botga ulanmagan. Havolani yuboring — &quot;Start&quot; bossa ulanadi.</p>
                    <Button size="sm" variant="outline" className="w-full" onClick={copyStudentLink} disabled={!botUsername}>Ulanish havolasini nusxalash</Button>
                  </div>)}
              </div>
            </CardContent>
          </Card>

          {/* Tangalar */}
          <Card className="rounded-2xl shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-white/10">
              <h3 className="font-semibold text-gray-900 dark:text-white text-base">Tangalar</h3>
            </div>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-800/40">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1.5"><Coins className="w-4 h-4 text-amber-500"/> Balans</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 text-lg">{lead.coins ?? 0}</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => giveCoins(1)}><Plus className="w-3.5 h-3.5"/> Berish</Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => giveCoins(-1)}><Minus className="w-3.5 h-3.5"/> Olish</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: tabs */}
        <div className="lg:col-span-2">
          <Card className="rounded-2xl shadow-sm">
            <div className="flex border-b border-gray-100 dark:border-white/10 px-4 overflow-x-auto">
              {tabs.map(t => {
            const Icon = t.icon;
            return (<button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${tab === t.key ? "border-[#5E2CA5] text-[#5E2CA5]" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
                    <Icon className="w-4 h-4"/>
                    {t.label}
                    {!!t.badge && <span className="ml-1 bg-[#5E2CA5]/10 text-[#5E2CA5] text-xs px-1.5 py-0.5 rounded-full">{t.badge}</span>}
                  </button>);
        })}
            </div>
            <CardContent>
              {tab === "activity" && (<div className="space-y-5">
                  {/* Add comment */}
                  <div>
                    <textarea value={newNote} onChange={e => setNewNote(e.target.value)} rows={2} placeholder="Mijoz bilan suhbatingizni yozing... (masalan: 'Telefon qildim, 2 kundan keyin qayta aloqaga chiqaman dedi')" className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-white/10 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5E2CA5] outline-none"/>
                    <div className="flex justify-end mt-2">
                      <Button size="sm" onClick={saveNote} disabled={!newNote.trim()} className="bg-[#5E2CA5] hover:bg-[#4e2488] text-white shadow-sm">Izoh qo&apos;shish</Button>
                    </div>
                  </div>

                  {/* Initial note */}
                  {lead.notes && (<div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-800/40 rounded-xl p-3 text-sm">
                      <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Dastlabki izoh</span>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mt-1">{lead.notes}</p>
                    </div>)}

                  {/* Timeline */}
                  {lead.activities.length === 0 ? <p className="text-center text-gray-400 py-8">Faollik yo&apos;q</p> : (<div className="relative">
                      <div className="absolute left-[5px] top-1 bottom-1 w-0.5 bg-gray-100 dark:bg-white/10"/>
                      <div className="space-y-4">
                        {lead.activities.map((a) => (<div key={a.id} className="relative flex items-start gap-3 pl-6">
                            <span className={`absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-gray-900 ${ACTIVITY_DOT[a.action] || "bg-gray-300"}`}/>
                            <div className="min-w-0">
                              <p className="text-sm text-gray-800 dark:text-gray-200">
                                <span className="font-medium">{a.user.fullName}</span>{" "}
                                {a.action === "status_changed" ? `statusni "${LEAD_STATUS_LABELS[a.details?.from ?? ""]}" → "${LEAD_STATUS_LABELS[a.details?.to ?? ""]}" ga o'zgartirdi` :
                        a.action === "lead_created" ? "lidni qo'shdi" :
                            a.action === "comment" ? `izoh qoldirdi: "${a.details?.text || ""}"` :
                                a.action === "note_added" ? "izoh qo'shdi" :
                                    a.action === "reminder_created" ? "eslatma yaratdi" :
                                        a.action === "lead_updated" ? "ma'lumotni yangiladi" : a.action}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(a.createdAt)}</p>
                            </div>
                          </div>))}
                      </div>
                    </div>)}
                </div>)}

              {tab === "reminders" && (<div className="space-y-4">
                  {/* Add reminder */}
                  <div className="p-3 rounded-xl border border-gray-100 dark:border-white/10 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input value={reminder.title} onChange={e => setReminder(r => ({ ...r, title: e.target.value }))} placeholder="Sarlavha..." className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-white/10 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5E2CA5] outline-none"/>
                      <input type="datetime-local" value={reminder.remindAt} onChange={e => setReminder(r => ({ ...r, remindAt: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-white/10 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5E2CA5] outline-none"/>
                    </div>
                    <Button size="sm" className="w-full bg-[#5E2CA5] hover:bg-[#4e2488] text-white shadow-sm" onClick={addReminder} loading={addingReminder}>
                      <Bell className="w-4 h-4"/> Eslatma qo&apos;shish
                    </Button>
                  </div>

                  {lead.reminders.map((r) => (<div key={r.id} className={`flex items-start gap-3 p-3 rounded-xl border ${r.status === "PENDING" ? "border-[#5E2CA5]/30 bg-[#5E2CA5]/5 dark:border-[#5E2CA5]/40" : r.status === "DONE" ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-500/10" : "border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/5"}`}>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{r.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(r.remindAt)} · {r.user.fullName}</p>
                        {r.description && <p className="text-xs text-gray-500 mt-1">{r.description}</p>}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${r.status === "DONE" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : r.status === "MISSED" ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" : "bg-[#5E2CA5]/10 text-[#5E2CA5]"}`}>
                        {r.status === "PENDING" ? "Kutilmoqda" : r.status === "DONE" ? "Bajarildi" : r.status === "MISSED" ? "O'tkazildi" : "Bekor"}
                      </span>
                    </div>))}
                  {lead.reminders.length === 0 && <p className="text-center text-gray-400 py-6">Eslatmalar yo&apos;q</p>}
                </div>)}

              {tab === "payments" && (<div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-800/40">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Jami to&apos;lov</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">{total.toLocaleString("ru-RU")} so&apos;m</span>
                  </div>
                  {lead.course && (<div className="flex items-center justify-between text-sm px-1">
                      <span className="text-gray-500">Kurs narxi</span>
                      <span className="font-semibold text-[#5E2CA5]">{formatCurrency(lead.course.price)}</span>
                    </div>)}
                  <div className="space-y-1.5">
                    {(lead.payments || []).map((p) => (<div key={p.id} className="flex items-center justify-between text-sm px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5">
                        <span className="text-gray-500">{new Date(p.paidAt).toLocaleDateString("ru-RU")}{p.forMonth ? ` · ${p.forMonth}` : ""}</span>
                        <span className="font-medium text-gray-900 dark:text-white">{Number(p.amount).toLocaleString("ru-RU")} so&apos;m</span>
                      </div>))}
                    {(lead.payments || []).length === 0 && <p className="text-center text-gray-400 py-6">To&apos;lovlar yo&apos;q</p>}
                  </div>
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
                  {attTotal === 0 && <p className="text-center text-gray-400 py-6">Davomat ma&apos;lumoti yo&apos;q</p>}
                </div>)}

              {tab === "scores" && (<div className="space-y-1.5">
                  {(lead.scores || []).map((s) => (<div key={s.id} className="flex items-center justify-between text-sm px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5">
                      <span className="text-gray-600 dark:text-gray-300 truncate">{s.exam?.title || "—"}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{s.score}{s.exam?.maxScore ? `/${s.exam.maxScore}` : ""}</span>
                    </div>))}
                  {(lead.scores || []).length === 0 && <p className="text-center text-gray-400 py-6">Ballar yo&apos;q</p>}
                </div>)}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>);
}
