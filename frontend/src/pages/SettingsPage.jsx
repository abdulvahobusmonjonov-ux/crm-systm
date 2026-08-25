import { useState, useEffect } from "react";
import { useSearchParams } from "@/lib/router";
import { toast } from "sonner";
import { Plus, Trash2, ToggleLeft, ToggleRight, Save, SlidersHorizontal, Image as ImageIcon, CreditCard, CalendarDays, Clock, Tag as TagIcon, MessageSquare, Send, Users as UsersIcon, Bot, CheckCircle2, XCircle, Webhook, } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { DatePicker } from "@/components/ui/date-picker";
import { useConfirm } from "@/components/ui/confirm";
import { useDarkMode } from "@/hooks/useDarkMode";
import { cn } from "@/lib/utils";
import { apiFetch, LOGO_URL } from "@/lib/api";
const TAG_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#06b6d4", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#84cc16"];
const VALID_TABS = ["general", "logo", "paymentTypes", "holidays", "timeslots", "tags", "sms", "telegram", "users"];
export default function SettingsPage() {
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");
    const [tab, setTab] = useState((tabParam && VALID_TABS.includes(tabParam) ? tabParam : "general"));
    const { confirm, dialog } = useConfirm();
    const [slots, setSlots] = useState([]);
    const [tags, setTags] = useState([]);
    const [newSlot, setNewSlot] = useState({ startTime: "", endTime: "" });
    const [newTag, setNewTag] = useState({ name: "", color: "#6366f1" });
    const [centerName, setCenterName] = useState("Robocode CRM");
    const [tgToken, setTgToken] = useState("");
    const [eskiz, setEskiz] = useState({ email: "", password: "", from: "" });
    const [smsTest, setSmsTest] = useState("");
    const [saving, setSaving] = useState(false);
    const [users, setUsers] = useState([]);
    const [chatIds, setChatIds] = useState({});
    const [contacts, setContacts] = useState([]);
    const [loadingContacts, setLoadingContacts] = useState(false);
    const [botUsername, setBotUsername] = useState("");
    const [webhookActive, setWebhookActive] = useState(false);
    const [activating, setActivating] = useState(false);
    const [quickTestChatId, setQuickTestChatId] = useState("");
    const [testingQuick, setTestingQuick] = useState(false);
    const [logo, setLogo] = useState("");
    const [logoSaving, setLogoSaving] = useState(false);
    const [paymentTypes, setPaymentTypes] = useState([]);
    const [newPaymentType, setNewPaymentType] = useState("");
    const { dark, toggleDark } = useDarkMode();
    const loadPaymentTypes = () => apiFetch("/api/payment-types").then(r => r.json()).then(d => setPaymentTypes(Array.isArray(d) ? d : []));
    const addPaymentType = async () => {
        if (!newPaymentType.trim()) {
            toast.error("Nom kiriting");
            return;
        }
        const res = await apiFetch("/api/payment-types", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newPaymentType.trim() }) });
        if (res.ok) {
            setNewPaymentType("");
            toast.success("Qo'shildi");
            loadPaymentTypes();
        }
        else
            toast.error("Xatolik");
    };
    const removePaymentType = async (id) => {
        if (!(await confirm({ title: "To'lov turini o'chirish", message: "Bu to'lov turini o'chirasizmi?" })))
            return;
        const res = await apiFetch(`/api/payment-types/${id}`, { method: "DELETE" });
        if (res.ok)
            loadPaymentTypes();
        else
            toast.error("Xatolik");
    };
    const [holidays, setHolidays] = useState([]);
    const [newHoliday, setNewHoliday] = useState({ date: "", name: "" });
    const loadHolidays = () => apiFetch("/api/holidays").then(r => r.json()).then(d => setHolidays(Array.isArray(d) ? d : []));
    const addHoliday = async () => {
        if (!newHoliday.date || !newHoliday.name.trim()) {
            toast.error("Sana va nom kiriting");
            return;
        }
        const res = await apiFetch("/api/holidays", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newHoliday) });
        if (res.ok) {
            setNewHoliday({ date: "", name: "" });
            toast.success("Qo'shildi");
            loadHolidays();
        }
        else {
            const d = await res.json().catch(() => ({}));
            toast.error(d.error || "Xatolik");
        }
    };
    const removeHoliday = async (id) => {
        if (!(await confirm({ title: "Bayram kunini o'chirish", message: "Bu kunni o'chirasizmi?" })))
            return;
        const res = await apiFetch(`/api/holidays/${id}`, { method: "DELETE" });
        if (res.ok)
            loadHolidays();
        else
            toast.error("Xatolik");
    };
    const saveEskiz = async () => {
        setSaving(true);
        await saveSetting("eskiz_email", eskiz.email.trim());
        if (eskiz.password.trim())
            await saveSetting("eskiz_password", eskiz.password.trim());
        await saveSetting("eskiz_from", eskiz.from.trim() || "4546");
        await saveSetting("eskiz_token", ""); // reset cached token so it re-logins
        setSaving(false);
        toast.success("Eskiz sozlamalari saqlandi");
    };
    const testSms = async () => {
        if (!smsTest) {
            toast.error("Telefon raqam kiriting");
            return;
        }
        const res = await apiFetch("/api/sms/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: smsTest, text: "Test SMS — Robocode CRM" }) });
        const d = await res.json().catch(() => ({}));
        res.ok ? toast.success("SMS yuborildi!") : toast.error(d.error || "Yuborilmadi");
    };
    const loadSlots = () => apiFetch("/api/timeslots").then(r => r.json()).then(setSlots);
    const loadTags = () => apiFetch("/api/tags").then(r => r.json()).then(setTags);
    const loadTgSettings = async () => {
        const s = await apiFetch("/api/settings").then(r => r.json());
        setTgToken(s["telegram_bot_token"] || "");
        setEskiz({ email: s["eskiz_email"] || "", password: "", from: s["eskiz_from"] || "" });
        if (s["center_name"])
            setCenterName(s["center_name"]);
        if (s["brand_logo"])
            setLogo(s["brand_logo"]);
        const cids = {};
        Object.entries(s).forEach(([k, v]) => { if (k.startsWith("telegram_chat_id_"))
            cids[k.replace("telegram_chat_id_", "")] = v; });
        setChatIds(cids);
    };
    const loadBotInfo = async () => {
        const res = await apiFetch("/api/telegram/setup");
        if (res.ok) {
            const d = await res.json();
            setBotUsername(d.username || "");
            setWebhookActive(!!d.active);
        }
    };
    useEffect(() => {
        loadSlots();
        loadTags();
        loadTgSettings();
        loadBotInfo();
        loadPaymentTypes();
        loadHolidays();
        apiFetch("/api/users").then(r => r.json()).then(setUsers);
    }, []);
    const activateBot = async () => {
        setActivating(true);
        const res = await apiFetch("/api/telegram/setup", { method: "POST" });
        const d = await res.json();
        setActivating(false);
        if (res.ok) {
            toast.success("Bot faollashtirildi! @" + d.username);
            setBotUsername(d.username || "");
            setWebhookActive(true);
        }
        else
            toast.error(d.error || "Xatolik");
    };
    const copyLink = (userId) => {
        if (!botUsername) {
            toast.error("Avval botni faollashtiring");
            return;
        }
        const link = `https://t.me/${botUsername}?start=${userId}`;
        navigator.clipboard.writeText(link).then(() => toast.success("Havola nusxalandi"), () => toast.error("Nusxalab bo'lmadi"));
    };
    const saveSetting = async (key, value) => {
        const res = await apiFetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, value }) });
        return res.ok;
    };
    const saveToken = async () => {
        setSaving(true);
        const ok = await saveSetting("telegram_bot_token", tgToken.trim());
        setSaving(false);
        ok ? toast.success("Token saqlandi") : toast.error("Saqlab bo'lmadi");
    };
    const saveChatId = async (userId) => {
        const ok = await saveSetting("telegram_chat_id_" + userId, (chatIds[userId] || "").trim());
        ok ? toast.success("Chat ID saqlandi") : toast.error("Xatolik");
    };
    const testChat = async (chatId) => {
        if (!chatId) {
            toast.error("Avval chat ID kiriting");
            return;
        }
        const res = await apiFetch("/api/telegram/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chatId }) });
        const data = await res.json();
        res.ok ? toast.success("Test xabar yuborildi! Telegram'ni tekshiring.") : toast.error(data.error || "Yuborilmadi");
    };
    const sendQuickTest = async () => {
        if (!quickTestChatId.trim()) {
            toast.error("Chat ID kiriting");
            return;
        }
        setTestingQuick(true);
        await testChat(quickTestChatId.trim());
        setTestingQuick(false);
    };
    const fetchContacts = async () => {
        setLoadingContacts(true);
        const res = await apiFetch("/api/telegram/contacts");
        const data = await res.json();
        if (res.ok) {
            setContacts(data.contacts || []);
            if (!data.contacts?.length)
                toast.info("Hech kim botga yozmagan. Hodimlar botga /start yuborsin.");
        }
        else
            toast.error(data.error || "Xatolik");
        setLoadingContacts(false);
    };
    const saveGeneral = async () => {
        setSaving(true);
        await saveSetting("center_name", centerName);
        setSaving(false);
        toast.success("Saqlandi");
    };
    const onLogoFile = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        if (!file.type.startsWith("image/")) {
            toast.error("Rasm fayli tanlang");
            return;
        }
        if (file.size > 1024 * 1024) {
            toast.error("Rasm 1MB dan kichik bo'lsin");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => setLogo(reader.result);
        reader.readAsDataURL(file);
    };
    const saveLogo = async () => {
        setLogoSaving(true);
        const ok = await saveSetting("brand_logo", logo);
        setLogoSaving(false);
        ok ? toast.success("Logo saqlandi! Sahifani yangilang.") : toast.error("Saqlab bo'lmadi");
    };
    const addSlot = async () => {
        if (!newSlot.startTime || !newSlot.endTime) {
            toast.error("Vaqtlarni kiriting");
            return;
        }
        const label = `${newSlot.startTime} - ${newSlot.endTime}`;
        const res = await apiFetch("/api/timeslots", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...newSlot, label }),
        });
        if (res.ok) {
            toast.success("Vaqt sloti qo'shildi");
            setNewSlot({ startTime: "", endTime: "" });
            loadSlots();
        }
        else
            toast.error("Xatolik");
    };
    const toggleSlot = async (slot) => {
        await apiFetch(`/api/timeslots/${slot.id}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: !slot.isActive }),
        });
        loadSlots();
    };
    const deleteSlot = async (id) => {
        if (!(await confirm({ title: "Slotni o'chirish", message: "Bu vaqt slotini o'chirishni tasdiqlaysizmi?" })))
            return;
        await apiFetch(`/api/timeslots/${id}`, { method: "DELETE" });
        loadSlots();
    };
    const addTag = async () => {
        if (!newTag.name.trim()) {
            toast.error("Tag nomini kiriting");
            return;
        }
        const res = await apiFetch("/api/tags", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newTag),
        });
        if (res.ok) {
            toast.success("Tag qo'shildi");
            setNewTag({ name: "", color: "#6366f1" });
            loadTags();
        }
        else
            toast.error("Bu nom band bo'lishi mumkin");
    };
    const deleteTag = async (id) => {
        await apiFetch(`/api/tags/${id}`, { method: "DELETE" });
        loadTags();
    };
    const tabs = [
        { key: "general", label: "Umumiy", icon: SlidersHorizontal },
        { key: "logo", label: "Logo", icon: ImageIcon },
        { key: "paymentTypes", label: "To'lov turlari", icon: CreditCard },
        { key: "holidays", label: "Bayram kunlari", icon: CalendarDays },
        { key: "timeslots", label: "Vaqt slotlari", icon: Clock },
        { key: "tags", label: "Teglar", icon: TagIcon },
        { key: "sms", label: "SMS", icon: MessageSquare },
        { key: "telegram", label: "Telegram", icon: Send },
        { key: "users", label: "Foydalanuvchilar", icon: UsersIcon },
    ];
    const inputFocus = "focus:ring-[#5E2CA5] focus:border-transparent";
    const purpleBtn = "bg-[#5E2CA5] hover:bg-[#4e2488] text-white shadow-sm";
    return (<div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
      {dialog}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sozlamalar</h1>
        <p className="text-sm text-gray-500 mt-0.5">Tizim sozlamalari</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar menu */}
        <Card className="w-full lg:w-64 shrink-0 h-fit p-2">
          <nav className="space-y-1">
            {tabs.map(t => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (<button key={t.key} onClick={() => setTab(t.key)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition ${active
                    ? "bg-[#5E2CA5]/10 text-[#5E2CA5]"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                  <Icon className="w-4 h-4 shrink-0"/>
                  {t.label}
                </button>);
        })}
          </nav>
        </Card>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* General */}
          {tab === "general" && (<Card className="rounded-2xl shadow-sm">
              <CardHeader><CardTitle>Umumiy sozlamalar</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Input label="Markaz nomi" value={centerName} onChange={e => setCenterName(e.target.value)} className={inputFocus}/>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Vaqt mintaqasi</label>
                  <select className={`w-full px-3 py-2 text-sm border border-gray-300 dark:border-white/10 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${inputFocus}`}>
                    <option value="Asia/Tashkent">Asia/Tashkent (UTC+5)</option>
                    <option value="Europe/Moscow">Europe/Moscow (UTC+3)</option>
                  </select>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-white/10">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Qorong&apos;i rejim</p>
                    <p className="text-xs text-gray-500 mt-0.5">Interfeys uchun qorong&apos;i mavzuni yoqish</p>
                  </div>
                  <button onClick={toggleDark} role="switch" aria-checked={dark} className={`relative inline-flex h-6 w-11 items-center rounded-full transition shrink-0 ${dark ? "bg-[#5E2CA5]" : "bg-gray-200 dark:bg-gray-700"}`}>
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${dark ? "translate-x-5" : "translate-x-0.5"}`}/>
                  </button>
                </div>
                <Button onClick={saveGeneral} loading={saving} className={purpleBtn}><Save className="w-4 h-4"/> Saqlash</Button>
              </CardContent>
            </Card>)}

          {/* Logo */}
          {tab === "logo" && (<Card className="rounded-2xl shadow-sm">
              <CardHeader><CardTitle>Logo</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-20 h-20 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                    <img src={logo || LOGO_URL} alt="Logo" className="w-full h-full object-contain"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Sayt logosi</p>
                    <p className="text-xs text-gray-500 mt-0.5">PNG yoki SVG, 1MB gacha. Login va yon menyuda chiqadi.</p>
                    <div className="flex items-center gap-2 mt-2">
                      <label className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                        Rasm yuklash
                        <input type="file" accept="image/*" onChange={onLogoFile} className="hidden"/>
                      </label>
                    </div>
                  </div>
                </div>
                <Button onClick={saveLogo} loading={logoSaving} className={purpleBtn}><Save className="w-4 h-4"/> Logoni saqlash</Button>
              </CardContent>
            </Card>)}

          {/* Payment types */}
          {tab === "paymentTypes" && (<Card className="rounded-2xl shadow-sm">
              <CardHeader><CardTitle>To&apos;lov turlari</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-gray-500">Naqd / Karta / O&apos;tkazma — asosiy turlar doim bor. Bu yerda qo&apos;shimcha turlarni qo&apos;shing (masalan: Click, Payme, Uzcard).</p>
                <div className="flex flex-wrap gap-2">
                  {paymentTypes.map((t) => (<div key={t.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-[#5E2CA5]/10 text-[#5E2CA5]">
                      {t.name}
                      <button onClick={() => removePaymentType(t.id)} className="ml-1 opacity-70 hover:opacity-100"><X className="w-3 h-3"/></button>
                    </div>))}
                  {paymentTypes.length === 0 && <p className="text-sm text-gray-400">Qo&apos;shimcha tur yo&apos;q</p>}
                </div>
                <div className="flex items-end gap-2 pt-2 border-t border-gray-100 dark:border-white/10">
                  <Input label="Yangi to'lov turi" value={newPaymentType} onChange={e => setNewPaymentType(e.target.value)} placeholder="Click / Payme..." className={`flex-1 ${inputFocus}`}/>
                  <Button onClick={addPaymentType} className={purpleBtn}><Plus className="w-4 h-4"/> Qo&apos;shish</Button>
                </div>
              </CardContent>
            </Card>)}

          {/* Holidays */}
          {tab === "holidays" && (<Card className="rounded-2xl shadow-sm">
              <CardHeader><CardTitle>Bayram kunlari</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-gray-500">Dars bo&apos;lmaydigan kunlar (bayramlar, ta&apos;til).</p>
                <div className="space-y-1.5">
                  {holidays.map((h) => (<div key={h.id} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
                      <span className="text-gray-700 dark:text-gray-300"><b>{new Date(h.date).toLocaleDateString("ru-RU")}</b> — {h.name}</span>
                      <button onClick={() => removeHoliday(h.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                    </div>))}
                  {holidays.length === 0 && <p className="text-sm text-gray-400">Bayram kuni yo&apos;q</p>}
                </div>
                <div className="flex items-end gap-2 pt-2 border-t border-gray-100 dark:border-white/10">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Sana</label>
                    <DatePicker value={newHoliday.date} onChange={e => setNewHoliday(h => ({ ...h, date: e.target.value }))} className={`px-3 py-2 text-sm ${inputFocus}`}/>
                  </div>
                  <Input label="Nomi" value={newHoliday.name} onChange={e => setNewHoliday(h => ({ ...h, name: e.target.value }))} placeholder="Navro'z" className={`flex-1 ${inputFocus}`}/>
                  <Button onClick={addHoliday} className={purpleBtn}><Plus className="w-4 h-4"/></Button>
                </div>
              </CardContent>
            </Card>)}

          {/* Time Slots */}
          {tab === "timeslots" && (<Card className="rounded-2xl shadow-sm">
              <CardHeader><CardTitle>Vaqt slotlari</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {slots.map(slot => (<div key={slot.id} className={`flex items-center justify-between p-3 rounded-xl border ${slot.isActive ? "border-gray-200 dark:border-white/10" : "border-gray-100 dark:border-white/10 opacity-50"}`}>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{slot.label}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleSlot(slot)} className="text-gray-400 hover:text-[#5E2CA5] transition">
                          {slot.isActive ? <ToggleRight className="w-5 h-5"/> : <ToggleLeft className="w-5 h-5"/>}
                        </button>
                        <button onClick={() => deleteSlot(slot.id)} className="text-gray-400 hover:text-red-600 transition"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </div>))}
                </div>
                <div className="flex items-end gap-3 pt-2 border-t border-gray-100 dark:border-white/10">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Boshlanish</label>
                    <input type="time" value={newSlot.startTime} onChange={e => setNewSlot(s => ({ ...s, startTime: e.target.value }))} className={`w-full px-3 py-2 text-sm border border-gray-300 dark:border-white/10 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 outline-none ${inputFocus}`}/>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Tugash</label>
                    <input type="time" value={newSlot.endTime} onChange={e => setNewSlot(s => ({ ...s, endTime: e.target.value }))} className={`w-full px-3 py-2 text-sm border border-gray-300 dark:border-white/10 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 outline-none ${inputFocus}`}/>
                  </div>
                  <Button onClick={addSlot} className={purpleBtn}><Plus className="w-4 h-4"/> Qo&apos;shish</Button>
                </div>
              </CardContent>
            </Card>)}

          {/* Tags */}
          {tab === "tags" && (<Card className="rounded-2xl shadow-sm">
              <CardHeader><CardTitle>Teglar</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (<div key={tag.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-white" style={{ backgroundColor: tag.color }}>
                      {tag.name}
                      <button onClick={() => deleteTag(tag.id)} className="ml-1 opacity-70 hover:opacity-100"><X className="w-3 h-3"/></button>
                    </div>))}
                  {tags.length === 0 && <p className="text-sm text-gray-400">Teglar yo&apos;q</p>}
                </div>
                <div className="flex items-end gap-3 pt-2 border-t border-gray-100 dark:border-white/10">
                  <Input label="Teg nomi" value={newTag.name} onChange={e => setNewTag(t => ({ ...t, name: e.target.value }))} placeholder="Muhim" className={`flex-1 ${inputFocus}`}/>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Rang</label>
                    <div className="flex gap-1.5">
                      {TAG_COLORS.map(c => (<button key={c} type="button" onClick={() => setNewTag(t => ({ ...t, color: c }))} className={`w-6 h-6 rounded-lg ${newTag.color === c ? "ring-2 ring-offset-1 ring-gray-400" : ""}`} style={{ backgroundColor: c }}/>))}
                    </div>
                  </div>
                  <Button onClick={addTag} className={purpleBtn}><Plus className="w-4 h-4"/></Button>
                </div>
              </CardContent>
            </Card>)}

          {/* SMS */}
          {tab === "sms" && (<Card className="rounded-2xl shadow-sm">
              <CardHeader><CardTitle>SMS (Eskiz.uz)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-gray-500">SMS yuborish uchun eskiz.uz dan ro&apos;yxatdan o&apos;ting va email/parolingizni kiriting. Sender nomi tasdiqlanmaguncha test uchun <b>4546</b> ishlaydi.</p>
                <Input label="Eskiz email" value={eskiz.email} onChange={e => setEskiz(s => ({ ...s, email: e.target.value }))} placeholder="email@example.com" className={inputFocus}/>
                <Input label="Eskiz parol" type="password" value={eskiz.password} onChange={e => setEskiz(s => ({ ...s, password: e.target.value }))} placeholder="••••••• (o'zgartirmasangiz bo'sh qoldiring)" className={inputFocus}/>
                <Input label="Sender (from)" value={eskiz.from} onChange={e => setEskiz(s => ({ ...s, from: e.target.value }))} placeholder="4546" className={inputFocus}/>
                <Button onClick={saveEskiz} loading={saving} className={purpleBtn}><Save className="w-4 h-4"/> Saqlash</Button>
                <div className="pt-3 border-t border-gray-100 dark:border-white/10">
                  <label className="block text-xs text-gray-500 mb-1">Test SMS yuborish</label>
                  <div className="flex items-end gap-2">
                    <PhoneInput value={smsTest} onChange={e => setSmsTest(e.target.value)} className="flex-1"/>
                    <Button size="sm" variant="outline" onClick={testSms}>Test</Button>
                  </div>
                </div>
              </CardContent>
            </Card>)}

          {/* Telegram */}
          {tab === "telegram" && (<Card className="rounded-2xl shadow-sm">
              <CardHeader className="flex items-center justify-between flex-row">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-[#5E2CA5]"/>
                  Telegram bot
                </CardTitle>
                <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium", webhookActive
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                : "bg-gray-100 text-gray-500 dark:bg-white/8 dark:text-gray-400")}>
                  {webhookActive ? <CheckCircle2 className="w-3.5 h-3.5"/> : <XCircle className="w-3.5 h-3.5"/>}
                  {webhookActive ? `Ulangan${botUsername ? ` · @${botUsername}` : ""}` : "Ulanmagan"}
                </span>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Token */}
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Input label="Bot Token" value={tgToken} onChange={e => setTgToken(e.target.value)} placeholder="123456:ABC-DEF..." type="password" className={inputFocus}/>
                  </div>
                  <Button onClick={saveToken} loading={saving} className={purpleBtn}><Save className="w-4 h-4"/> Saqlash</Button>
                </div>

                {/* Webhook status */}
                <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-white/10">
                  <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-[#5E2CA5]/10 dark:bg-[#5E2CA5]/20 flex items-center justify-center">
                    <Webhook className="w-4 h-4 text-[#5E2CA5]"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Webhook holati: {webhookActive
                ? <span className="text-emerald-600 dark:text-emerald-400">faol</span>
                : <span className="text-gray-400">o&apos;chiq</span>}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Tokenni saqlagandan keyin botni faollashtiring — shunda bot buyruqlarga javob beradi.</p>
                  </div>
                  <Button size="sm" onClick={activateBot} loading={activating} className={purpleBtn}>Botni faollashtirish</Button>
                </div>

                {/* Quick test message */}
                <div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 space-y-2.5">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Send className="w-3.5 h-3.5 text-[#5E2CA5]"/> Test xabar yuborish
                  </p>
                  <p className="text-xs text-gray-500">Chat ID kiritib botning ishlayotganini tekshiring (Chat ID — Foydalanuvchilar bo&apos;limida).</p>
                  <div className="flex items-end gap-2">
                    <input value={quickTestChatId} onChange={e => setQuickTestChatId(e.target.value)} placeholder="Chat ID" className={`flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 ${inputFocus}`}/>
                    <Button size="sm" onClick={sendQuickTest} loading={testingQuick} className={purpleBtn}>
                      <Send className="w-3.5 h-3.5"/> Yuborish
                    </Button>
                  </div>
                </div>

                {/* How it connects */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Qanday ulanadi:</p>
                  <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                    <li>@BotFather dan bot yarating va tokenini bu yerga saqlang</li>
                    <li><b>Botni faollashtirish</b> tugmasini bosing</li>
                    <li>Foydalanuvchilar bo&apos;limida har bir hodim uchun <b>ulanish havolasi</b> chiqadi — uni hodimga yuboring</li>
                    <li>Hodim havolani ochib <b>Start</b> bossa — avtomatik ulanadi</li>
                  </ol>
                </div>
              </CardContent>
            </Card>)}

          {/* Users */}
          {tab === "users" && (<Card className="rounded-2xl shadow-sm">
              <CardHeader><CardTitle>Foydalanuvchilarni ulash</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-gray-500">
                  Har bir hodimga o&apos;z havolasini yuboring. Hodim havolani ochib <b>Start</b> bossa — avtomatik ulanadi.
                  {webhookActive && <span className="text-green-600"> Ulangan hodimda yashil ✅ ko&apos;rinadi.</span>}
                </p>
                <div className="space-y-3">
                  {users.map((u) => (<div key={u.id} className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 dark:border-white/10">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {chatIds[u.id] ? "✅ " : ""}{u.fullName} <span className="text-gray-400 font-normal">@{u.username}</span>
                        </p>
                        {botUsername && (<code className="text-xs text-[#5E2CA5] font-mono truncate block">
                            t.me/{botUsername}?start={u.id}
                          </code>)}
                      </div>
                      <Button size="sm" variant="outline" onClick={() => copyLink(u.id)} disabled={!botUsername}>Havolani nusxalash</Button>
                      {chatIds[u.id] && <Button size="sm" onClick={() => testChat(chatIds[u.id])} className={purpleBtn}>Test</Button>}
                    </div>))}
                  {users.length === 0 && <p className="text-sm text-gray-400">Hodimlar yo&apos;q</p>}
                </div>

                <details className="pt-2 border-t border-gray-100 dark:border-white/10">
                  <summary className="text-xs text-gray-400 cursor-pointer">Qo&apos;lda chat ID kiritish (ixtiyoriy)</summary>
                  <div className="mt-2">
                    <Button size="sm" variant="outline" onClick={fetchContacts} loading={loadingContacts}>Botga yozganlarni ko&apos;rsatish</Button>
                    {contacts.length > 0 && (<div className="mt-3 space-y-1.5">
                        {contacts.map((c) => (<div key={c.chatId} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
                            <span className="text-gray-700 dark:text-gray-300">{c.name} {c.username && <span className="text-gray-400">{c.username}</span>}</span>
                            <code className="text-xs text-[#5E2CA5] font-mono select-all">{c.chatId}</code>
                          </div>))}
                      </div>)}
                    <div className="space-y-2 mt-3">
                      {users.map((u) => (<div key={u.id} className="flex items-end gap-2">
                          <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">{u.fullName}</label>
                            <input value={chatIds[u.id] || ""} onChange={e => setChatIds(c => ({ ...c, [u.id]: e.target.value }))} placeholder="Chat ID" className={`w-full px-3 py-2 text-sm border border-gray-300 dark:border-white/10 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 outline-none ${inputFocus}`}/>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => saveChatId(u.id)}>Saqlash</Button>
                        </div>))}
                    </div>
                  </div>
                </details>
              </CardContent>
            </Card>)}
        </div>
      </div>
    </div>
  </div>);
}
function X({ className }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>;
}
