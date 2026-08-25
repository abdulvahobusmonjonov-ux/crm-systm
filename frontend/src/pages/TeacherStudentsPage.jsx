import { useState, useEffect, useCallback } from "react";
import Link from "@/components/ui/link";
import { useSession } from "@/lib/session";
import { Search, Users, Coins } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatPhone, formatDate, formatRelativeTime, getInitials } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
export default function TeacherStudentsPage() {
    const { data: session } = useSession();
    const isAdminRole = session?.user?.role === "SUPER_ADMIN" || session?.user?.role === "ADMIN";
    const showPayments = isAdminRole || !!session?.user?.canSeePayments;
    const showContacts = isAdminRole || !!session?.user?.canSeeStudentContacts;
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const load = useCallback(async (q) => {
        setLoading(true);
        const params = new URLSearchParams();
        if (q.trim())
            params.set("search", q.trim());
        const data = await apiFetch(`/api/teacher/students?${params}`).then((r) => r.json());
        setStudents(Array.isArray(data?.students) ? data.students : []);
        setLoading(false);
    }, []);
    useEffect(() => {
        const t = setTimeout(() => load(search), 250);
        return () => clearTimeout(t);
    }, [search, load]);
    return (<div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">O&apos;quvchilar</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{loading ? "Yuklanmoqda..." : `${students.length} ta o'quvchi`}</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ism yoki telefon..." className="w-full pl-9 pr-4 py-2 text-[13px] border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 focus:border-[#5E2CA5]/50 transition"/>
        </div>
      </div>

      <Card className="overflow-hidden">
        {loading ? (<div className="p-5 space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse"/>)}
          </div>) : students.length === 0 ? (<div className="py-16 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-[#5E2CA5]/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-[#5E2CA5]"/>
            </div>
            <p className="text-gray-700 dark:text-gray-200 font-medium text-sm">O&apos;quvchi topilmadi</p>
          </div>) : (<div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-white/5">
                  <th className="px-5 py-3 font-medium">Ism</th>
                  {showContacts && <th className="px-5 py-3 font-medium hidden sm:table-cell">Telefon</th>}
                  <th className="px-5 py-3 font-medium hidden md:table-cell">Guruh</th>
                  {showPayments && <th className="px-5 py-3 font-medium">Balans</th>}
                  <th className="px-5 py-3 font-medium hidden lg:table-cell">Tug&apos;ilgan sana</th>
                  <th className="px-5 py-3 font-medium hidden lg:table-cell">Oxirgi faollik</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (<tr key={s.id} className="border-b last:border-0 border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link href={`/teacher/students/${s.id}`} className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: "#5E2CA5" }}>
                          {getInitials(s.fullName)}
                        </div>
                        <span className="text-[13px] font-semibold text-gray-900 dark:text-white hover:text-[#5E2CA5] transition-colors">{s.fullName}</span>
                      </Link>
                    </td>
                    {showContacts && (<td className="px-5 py-3.5 hidden sm:table-cell text-[13px] text-gray-500 dark:text-gray-400">{s.phone ? formatPhone(s.phone) : "—"}</td>)}
                    <td className="px-5 py-3.5 hidden md:table-cell text-[13px] text-gray-500 dark:text-gray-400">{s.group?.name || "—"}</td>
                    {showPayments && (<td className="px-5 py-3.5">
                        <span className={(s.balance ?? 0) > 0 ? "text-red-600 dark:text-red-400 font-semibold text-[13px]" : "text-emerald-600 dark:text-emerald-400 font-semibold text-[13px]"}>
                          {Math.abs(s.balance ?? 0).toLocaleString("ru-RU")} so&apos;m
                        </span>
                        <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-amber-500">
                          <Coins className="w-3 h-3"/> {s.coins}
                        </span>
                      </td>)}
                    <td className="px-5 py-3.5 hidden lg:table-cell text-[13px] text-gray-500 dark:text-gray-400">{s.birthDate ? formatDate(s.birthDate) : "—"}</td>
                    <td className="px-5 py-3.5 hidden lg:table-cell text-[13px] text-gray-500 dark:text-gray-400">{s.lastActivityAt ? formatRelativeTime(s.lastActivityAt) : "—"}</td>
                  </tr>))}
              </tbody>
            </table>
          </div>)}
      </Card>
    </div>);
}
