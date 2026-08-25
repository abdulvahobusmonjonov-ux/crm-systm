import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/lib/session";
import { toast } from "sonner";
import { Search, Plus, Phone, CheckCircle2, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Modal, ModalPrimaryButton, ModalSecondaryButton } from "@/components/ui/modal";
import { PhoneInput } from "@/components/ui/phone-input";
import { LEAD_STATUS_LABELS, LEAD_STATUS_COLORS, LEAD_SOURCE_LABELS } from "@/lib/constants";
import { formatPhone, formatRelativeTime, getInitials, isPhoneComplete } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
const fieldCls = "w-full px-3 py-2 text-[13px] border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 focus:border-[#5E2CA5]/50 transition";
const labelCls = "block text-[11px] font-medium text-gray-400 dark:text-gray-500 mb-1.5";
export default function ReceptionPage() {
    const { data: session } = useSession();
    const isAdminRole = session?.user?.role === "SUPER_ADMIN" || session?.user?.role === "ADMIN";
    const canManage = isAdminRole || !!session?.user?.canManageLeads;
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [search, setSearch] = useState("");
    const [showAdd, setShowAdd] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ fullName: "", phone: "", source: "WALK_IN" });
    const load = useCallback(async (q) => {
        setLoading(true);
        setError(false);
        try {
            const params = new URLSearchParams({ limit: "50" });
            if (q.trim())
                params.set("search", q.trim());
            const res = await apiFetch(`/api/leads?${params}`);
            if (!res.ok) {
                setError(true);
                setLoading(false);
                return;
            }
            const data = await res.json();
            setLeads(Array.isArray(data?.leads) ? data.leads : []);
        }
        catch {
            setError(true);
        }
        setLoading(false);
    }, []);
    useEffect(() => {
        const t = setTimeout(() => load(search), 250);
        return () => clearTimeout(t);
    }, [search, load]);
    const createLead = async () => {
        if (form.fullName.trim().length < 2) {
            toast.error("Ismni to'liq kiriting");
            return;
        }
        if (!isPhoneComplete(form.phone)) {
            toast.error("Telefon raqamni to'liq kiriting");
            return;
        }
        setCreating(true);
        const res = await apiFetch("/api/leads", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        if (res.ok) {
            toast.success("Lid qo'shildi");
            setShowAdd(false);
            setForm({ fullName: "", phone: "", source: "WALK_IN" });
            load(search);
        }
        else {
            const err = await res.json().catch(() => ({}));
            toast.error(err.error === "string" ? err.error : "Qo'shilmadi (telefon band bo'lishi mumkin)");
        }
        setCreating(false);
    };
    const logCall = async (leadId) => {
        const res = await apiFetch(`/api/leads/${leadId}/activity`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "call", details: { note: "Reception orqali qo'ng'iroq" } }),
        });
        if (res.ok)
            toast.success("Qo'ng'iroq qayd etildi");
        else
            toast.error("Saqlanmadi");
    };
    const enrollLead = async (leadId) => {
        const res = await apiFetch(`/api/leads/${leadId}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "ENROLLED", enrolledAt: new Date().toISOString() }),
        });
        if (res.ok) {
            toast.success("Ro'yxatga olindi");
            load(search);
        }
        else
            toast.error("Saqlanmadi");
    };
    return (<div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Lidlar</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{loading ? "Yuklanmoqda..." : `${leads.length} ta lid`}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ism yoki telefon..." className="w-full pl-9 pr-4 py-2 text-[13px] border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 focus:border-[#5E2CA5]/50 transition"/>
          </div>
          {canManage && (<button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium bg-[#5E2CA5] hover:bg-[#4a2280] text-white shadow-sm transition-colors whitespace-nowrap">
              <Plus className="w-4 h-4"/> Yangi lid
            </button>)}
        </div>
      </div>

      <Card className="overflow-hidden">
        {loading ? (<div className="p-5 space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse"/>)}
          </div>) : error ? (<div className="py-16 text-center text-[13px] text-red-500">Ma&apos;lumotni yuklab bo&apos;lmadi. Sahifani yangilab ko&apos;ring.</div>) : leads.length === 0 ? (<div className="py-16 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-[#5E2CA5]/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-[#5E2CA5]"/>
            </div>
            <p className="text-gray-700 dark:text-gray-200 font-medium text-sm">Lid topilmadi</p>
          </div>) : (<div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-white/5">
                  <th className="px-5 py-3 font-medium">Ism</th>
                  <th className="px-5 py-3 font-medium hidden sm:table-cell">Telefon</th>
                  <th className="px-5 py-3 font-medium">Holat</th>
                  <th className="px-5 py-3 font-medium hidden md:table-cell">Oxirgi aloqa</th>
                  {canManage && <th className="px-5 py-3 font-medium text-right">Harakatlar</th>}
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (<tr key={l.id} className="border-b last:border-0 border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: "#5E2CA5" }}>
                          {getInitials(l.fullName)}
                        </div>
                        <span className="text-[13px] font-semibold text-gray-900 dark:text-white">{l.fullName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell text-[13px] text-gray-500 dark:text-gray-400">{formatPhone(l.phone)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${LEAD_STATUS_COLORS[l.status] || ""}`}>
                        {LEAD_STATUS_LABELS[l.status] || l.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell text-[13px] text-gray-500 dark:text-gray-400">
                      {l.lastContactedAt ? formatRelativeTime(l.lastContactedAt) : "—"}
                    </td>
                    {canManage && (<td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => logCall(l.id)} title="Qo'ng'iroq qayd etish" className="p-1.5 text-gray-400 hover:text-[#5E2CA5] hover:bg-[#5E2CA5]/10 rounded-lg transition-colors">
                            <Phone className="w-3.5 h-3.5"/>
                          </button>
                          {l.status !== "ENROLLED" && (<button onClick={() => enrollLead(l.id)} title="Ro'yxatga olish" className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors">
                              <CheckCircle2 className="w-3.5 h-3.5"/>
                            </button>)}
                        </div>
                      </td>)}
                  </tr>))}
              </tbody>
            </table>
          </div>)}
      </Card>

      {showAdd && (<Modal title="Yangi lid" onClose={() => setShowAdd(false)} footer={<>
              <ModalPrimaryButton onClick={createLead} loading={creating}>Qo&apos;shish</ModalPrimaryButton>
              <ModalSecondaryButton onClick={() => setShowAdd(false)}>Bekor qilish</ModalSecondaryButton>
            </>}>
          <div>
            <label className={labelCls}>To&apos;liq ism *</label>
            <input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} placeholder="Ism Familiya" className={fieldCls}/>
          </div>
          <div>
            <label className={labelCls}>Telefon *</label>
            <PhoneInput value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}/>
          </div>
          <div>
            <label className={labelCls}>Manba</label>
            <select value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))} className={fieldCls}>
              {Object.entries(LEAD_SOURCE_LABELS).map(([value, label]) => (<option key={value} value={value}>{label}</option>))}
            </select>
          </div>
        </Modal>)}
    </div>);
}
