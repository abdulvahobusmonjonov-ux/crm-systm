import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, UserCheck, UserX, Search } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm";
import { ROLE_LABELS } from "@/lib/permissions";
import { cn, formatDate, getInitials } from "@/lib/utils";
import UserFormModal from "@/components/dashboard/UserFormModal";
import { apiFetch } from "@/lib/api";
const BRAND = "#5E2CA5";
// Role badge styles per spec: Super Admin=purple, Admin=blue, Operator=amber, Manager=green
const ROLE_BADGE_CLS = {
    SUPER_ADMIN: "bg-[#5E2CA5]/10 text-[#5E2CA5] dark:bg-[#5E2CA5]/20",
    ADMIN: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
    OPERATOR: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
    MANAGER: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
    MENTOR: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400",
    RECEPTION: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400",
    ACCOUNTANT: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
};
const TH = "px-4 py-3 text-left text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide whitespace-nowrap";
export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const loadUsers = async () => {
        const res = await apiFetch("/api/users");
        if (res.ok)
            setUsers(await res.json());
        setLoading(false);
    };
    useEffect(() => { loadUsers(); }, []);
    const filtered = users.filter((u) => u.fullName.toLowerCase().includes(search.toLowerCase()) ||
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(search.toLowerCase()));
    const handleToggleActive = async (user) => {
        const res = await apiFetch(`/api/users/${user.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: !user.isActive }),
        });
        if (res.ok) {
            toast.success(user.isActive ? "Hodim bloklandi" : "Hodim faollashtirildi");
            loadUsers();
        }
    };
    const { confirm, dialog } = useConfirm();
    const handleDelete = async (user) => {
        if (!(await confirm({ title: "Hodimni o'chirish", message: `${user.fullName} ni o'chirishni tasdiqlaysizmi?` })))
            return;
        const res = await apiFetch(`/api/users/${user.id}`, { method: "DELETE" });
        if (res.ok) {
            toast.success("Hodim o'chirildi");
            loadUsers();
        }
        else {
            const err = await res.json();
            toast.error(err.error || "Xatolik yuz berdi");
        }
    };
    return (<div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      {dialog}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Hodimlar</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{users.length} ta hodim</p>
        </div>
        <button onClick={() => { setEditUser(null); setModalOpen(true); }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium bg-[#5E2CA5] hover:bg-[#4a2280] text-white shadow-sm transition-colors">
          <Plus className="w-4 h-4"/> Yangi hodim
        </button>
      </div>

      {/* Table card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">

        {/* Search */}
        <div className="p-4 border-b border-gray-100 dark:border-white/5">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
            <input placeholder="Qidirish (ism, username, email)..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-[13px] border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 focus:border-[#5E2CA5]/50 transition"/>
          </div>
        </div>

        {loading ? (<div className="py-16 text-center text-[13px] text-gray-400 animate-pulse">Yuklanmoqda...</div>) : filtered.length === 0 ? (<div className="py-16 text-center">
            <div className="text-4xl mb-3">👤</div>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">Hodim topilmadi</p>
            <p className="text-[12px] text-gray-400 mt-1">Yangi hodim qo&apos;shing</p>
          </div>) : (<div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5">
                  <th className={TH}>Ism</th>
                  <th className={TH}>Rol</th>
                  <th className={TH}>Email</th>
                  <th className={cn(TH, "text-right")}>Faol lidlar</th>
                  <th className={TH}>Oxirgi kirish</th>
                  <th className={TH}>Holat</th>
                  <th className={cn(TH, "w-24")}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {filtered.map((user) => (<tr key={user.id} className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors duration-100">

                    {/* Ism + avatar */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0" style={{ backgroundColor: BRAND }}>
                          {getInitials(user.fullName)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{user.fullName}</p>
                          <p className="text-[11px] text-gray-400 font-mono">@{user.username}</p>
                        </div>
                      </div>
                    </td>

                    {/* Rol badge */}
                    <td className="px-4 py-3">
                      <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap", ROLE_BADGE_CLS[user.role] || "bg-gray-100 text-gray-600 dark:bg-white/8 dark:text-gray-400")}>
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 text-[13px] text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                      {user.email || <span className="text-gray-300">—</span>}
                    </td>

                    {/* Faol lidlar */}
                    <td className="px-4 py-3 text-right text-[13px] text-gray-500 dark:text-gray-400 tabular-nums">
                      {user._count.leads}
                    </td>

                    {/* Oxirgi kirish */}
                    <td className="px-4 py-3 text-[13px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      {user.lastLoginAt ? formatDate(user.lastLoginAt) : "Hali kirmagan"}
                    </td>

                    {/* Holat badge */}
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap", user.isActive
                    ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                    : "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400")}>
                        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", user.isActive ? "bg-emerald-500" : "bg-red-500")}/>
                        {user.isActive ? "Faol" : "Nofaol"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        <button onClick={() => { setEditUser(user); setModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-[#5E2CA5] hover:bg-[#5E2CA5]/10 rounded-lg transition-colors" title="Tahrirlash">
                          <Edit className="w-3.5 h-3.5"/>
                        </button>
                        <button onClick={() => handleToggleActive(user)} className={cn("p-1.5 rounded-lg transition-colors", user.isActive
                    ? "text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                    : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10")} title={user.isActive ? "Bloklash" : "Faollashtirish"}>
                          {user.isActive ? <UserX className="w-3.5 h-3.5"/> : <UserCheck className="w-3.5 h-3.5"/>}
                        </button>
                        <button onClick={() => handleDelete(user)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors" title="O'chirish">
                          <Trash2 className="w-3.5 h-3.5"/>
                        </button>
                      </div>
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>)}
      </div>

      {modalOpen && (<UserFormModal user={editUser} onClose={() => { setModalOpen(false); setEditUser(null); }} onSuccess={() => { setModalOpen(false); setEditUser(null); loadUsers(); }}/>)}
    </div>);
}
