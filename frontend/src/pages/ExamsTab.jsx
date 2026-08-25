import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/lib/session";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { formatDateUz } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Modal, ModalPrimaryButton, ModalSecondaryButton } from "@/components/ui/modal";
import { DatePicker } from "@/components/ui/date-picker";
import { useConfirm } from "@/components/ui/confirm";
import { apiFetch } from "@/lib/api";
const fieldCls = "w-full px-3 py-2 text-[13px] border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 focus:border-[#5E2CA5]/50 transition";
const labelCls = "block text-[11px] font-medium text-gray-400 dark:text-gray-500 mb-1.5";
export default function ExamsTab({ groupId }) {
    const { data: session } = useSession();
    const isAdminRole = session?.user?.role === "SUPER_ADMIN" || session?.user?.role === "ADMIN";
    const canEdit = isAdminRole || !!session?.user?.canManageGrades;
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ title: "", date: "", maxScore: "100", passingScore: "", section: "" });
    const { confirm, dialog } = useConfirm();
    const load = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            const res = await apiFetch(`/api/teacher/groups/${groupId}/exams`);
            if (!res.ok) {
                setError(true);
                setLoading(false);
                return;
            }
            const data = await res.json();
            setExams((data.exams || []).map((e) => ({ ...e, date: e.date.slice(0, 10) })));
        }
        catch {
            setError(true);
        }
        setLoading(false);
    }, [groupId]);
    useEffect(() => { load(); }, [load]);
    const create = async () => {
        if (!form.title.trim() || !form.date) {
            toast.error("Nomi va sanani kiriting");
            return;
        }
        setCreating(true);
        const res = await apiFetch(`/api/teacher/groups/${groupId}/exams`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: form.title,
                date: form.date,
                maxScore: Number(form.maxScore) || 100,
                passingScore: form.passingScore ? Number(form.passingScore) : null,
                section: form.section || null,
            }),
        });
        if (res.ok) {
            toast.success("Imtihon qo'shildi");
            setShowAdd(false);
            setForm({ title: "", date: "", maxScore: "100", passingScore: "", section: "" });
            load();
        }
        else
            toast.error("Qo'shilmadi");
        setCreating(false);
    };
    const remove = async (id) => {
        if (!(await confirm({ title: "Imtihonni o'chirish", message: "Bu imtihonni o'chirasizmi?" })))
            return;
        const res = await apiFetch(`/api/teacher/groups/${groupId}/exams/${id}`, { method: "DELETE" });
        if (res.ok) {
            toast.success("O'chirildi");
            load();
        }
        else
            toast.error("O'chirib bo'lmadi");
    };
    return (<div className="space-y-3">
      {dialog}
      {canEdit && (<div className="flex items-center justify-end">
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium bg-[#5E2CA5] hover:bg-[#4a2280] text-white shadow-sm transition-colors">
            <Plus className="w-4 h-4"/> Yangi imtihon qo&apos;shish
          </button>
        </div>)}

      <Card className="overflow-hidden">
        {loading ? (<div className="py-16 text-center text-[13px] text-gray-400 animate-pulse">Yuklanmoqda...</div>) : error ? (<div className="py-16 text-center text-[13px] text-red-500">Ma&apos;lumotni yuklab bo&apos;lmadi. Sahifani yangilab ko&apos;ring.</div>) : exams.length === 0 ? (<div className="py-16 text-center text-[13px] text-gray-400">Hali imtihon qo&apos;shilmagan</div>) : (<div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-white/5">
                  <th className="px-5 py-3 font-medium">Nomi</th>
                  <th className="px-5 py-3 font-medium">Sana</th>
                  <th className="px-5 py-3 font-medium">O&apos;tish bali</th>
                  <th className="px-5 py-3 font-medium">Bo&apos;lim</th>
                  <th className="px-5 py-3 font-medium text-right">Harakatlar</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((e) => (<tr key={e.id} className="border-b last:border-0 border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3.5 text-[13px] font-semibold text-gray-900 dark:text-white">{e.title}</td>
                    <td className="px-5 py-3.5 text-[13px] text-gray-500 dark:text-gray-400">{formatDateUz(e.date)}</td>
                    <td className="px-5 py-3.5 text-[13px] text-gray-500 dark:text-gray-400">{e.passingScore ?? "—"} / {e.maxScore}</td>
                    <td className="px-5 py-3.5 text-[13px] text-gray-500 dark:text-gray-400">{e.section || "—"}</td>
                    <td className="px-5 py-3.5 text-right">
                      {canEdit && (<button onClick={() => remove(e.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5"/>
                        </button>)}
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>)}
      </Card>

      {showAdd && (<Modal title="Yangi imtihon" onClose={() => setShowAdd(false)} footer={<>
              <ModalPrimaryButton onClick={create} loading={creating}>Qo&apos;shish</ModalPrimaryButton>
              <ModalSecondaryButton onClick={() => setShowAdd(false)}>Bekor qilish</ModalSecondaryButton>
            </>}>
          <div>
            <label className={labelCls}>Nomi *</label>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Masalan: 1-modul yakuniy" className={fieldCls}/>
          </div>
          <div>
            <label className={labelCls}>Sana *</label>
            <DatePicker value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className={fieldCls}/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Maksimal ball</label>
              <input type="number" min={1} value={form.maxScore} onChange={(e) => setForm((f) => ({ ...f, maxScore: e.target.value }))} className={fieldCls}/>
            </div>
            <div>
              <label className={labelCls}>O&apos;tish bali</label>
              <input type="number" min={0} value={form.passingScore} onChange={(e) => setForm((f) => ({ ...f, passingScore: e.target.value }))} className={fieldCls}/>
            </div>
          </div>
          <div>
            <label className={labelCls}>Bo&apos;lim</label>
            <input value={form.section} onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))} placeholder="Masalan: Grammar" className={fieldCls}/>
          </div>
        </Modal>)}
    </div>);
}
