import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { Search, Save, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ROLE_LABELS } from "@/lib/permissions";
import { PERMISSION_CATALOG, TIER_LABELS } from "@/lib/permission-catalog";
import { cn, getInitials } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
const TIER_BADGE_CLS = {
    ready: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
    partial: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
    planned: "bg-gray-100 text-gray-500 dark:bg-white/8 dark:text-gray-400",
};
// Group the flat catalog into modules once, up front (order-preserving).
const MODULES = (() => {
    const byModule = new Map();
    for (const p of PERMISSION_CATALOG) {
        if (!byModule.has(p.module))
            byModule.set(p.module, { module: p.module, moduleLabel: p.moduleLabel, actions: [] });
        byModule.get(p.module).actions.push(p);
    }
    return Array.from(byModule.values());
})();
export default function PermissionsPage() {
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedId, setSelectedId] = useState(null);
    const [granted, setGranted] = useState(new Set());
    const [dirty, setDirty] = useState(new Map());
    const [loadingGrants, setLoadingGrants] = useState(false);
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        apiFetch("/api/users")
            .then((r) => r.json())
            .then((data) => setUsers(Array.isArray(data) ? data : []))
            .finally(() => setLoadingUsers(false));
    }, []);
    const filtered = useMemo(() => users.filter((u) => u.fullName.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase())), [users, search]);
    const loadGrants = useCallback(async (userId) => {
        setLoadingGrants(true);
        setDirty(new Map());
        const res = await apiFetch(`/api/permissions/users/${userId}`);
        if (res.ok) {
            const data = await res.json();
            setGranted(new Set(data.granted || []));
        }
        else {
            toast.error("Ruxsatlarni yuklab bo'lmadi");
        }
        setLoadingGrants(false);
    }, []);
    const selectUser = (id) => {
        setSelectedId(id);
        loadGrants(id);
    };
    const key = (module, action) => `${module}:${action}`;
    const isGranted = (module, action) => {
        const k = key(module, action);
        return dirty.has(k) ? dirty.get(k) : granted.has(k);
    };
    const toggle = (module, action, tier) => {
        if (tier !== "ready")
            return;
        const k = key(module, action);
        setDirty((prev) => {
            const next = new Map(prev);
            next.set(k, !isGranted(module, action));
            return next;
        });
    };
    const save = async () => {
        if (!selectedId || dirty.size === 0)
            return;
        setSaving(true);
        const grants = Array.from(dirty.entries()).map(([k, g]) => {
            const [module, action] = k.split(":");
            return { module, action, granted: g };
        });
        const res = await apiFetch(`/api/permissions/users/${selectedId}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ grants }),
        });
        if (res.ok) {
            toast.success("Ruxsatlar saqlandi");
            setGranted((prev) => {
                const next = new Set(prev);
                for (const g of grants) {
                    const k = key(g.module, g.action);
                    if (g.granted)
                        next.add(k);
                    else
                        next.delete(k);
                }
                return next;
            });
            setDirty(new Map());
        }
        else
            toast.error("Saqlanmadi");
        setSaving(false);
    };
    const selectedUser = users.find((u) => u.id === selectedId);
    return (<div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Rollar va ruxsatlar</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Har xodim uchun modul bo&apos;yicha ruxsatlarni boshqaring</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        {/* Left: staff list */}
        <Card className="overflow-hidden lg:h-[calc(100vh-160px)] flex flex-col">
          <div className="p-3 border-b border-gray-100 dark:border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Qidirish..." className="w-full pl-9 pr-3 py-2 text-[13px] border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 focus:border-[#5E2CA5]/50 transition"/>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingUsers ? (<div className="p-4 space-y-2">
                {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse"/>)}
              </div>) : (filtered.map((u) => (<button key={u.id} onClick={() => selectUser(u.id)} className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors", selectedId === u.id ? "bg-[#5E2CA5]/8 dark:bg-[#5E2CA5]/15" : "hover:bg-gray-50 dark:hover:bg-white/5")}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0" style={{ backgroundColor: "#5E2CA5" }}>
                    {getInitials(u.fullName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-[13px] font-medium truncate", selectedId === u.id ? "text-[#5E2CA5]" : "text-gray-900 dark:text-white")}>{u.fullName}</p>
                    <p className="text-[11px] text-gray-400 truncate">{ROLE_LABELS[u.role] || u.role}</p>
                  </div>
                </button>)))}
          </div>
        </Card>

        {/* Right: module toggles */}
        <Card className="overflow-hidden">
          {!selectedId ? (<div className="py-20 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-[#5E2CA5]/10 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-[#5E2CA5]"/>
              </div>
              <p className="text-gray-700 dark:text-gray-200 font-medium text-sm">Chapdan xodimni tanlang</p>
            </div>) : loadingGrants ? (<div className="py-20 text-center text-[13px] text-gray-400 animate-pulse">Yuklanmoqda...</div>) : (<>
              <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-[15px] font-bold text-gray-900 dark:text-white">{selectedUser?.fullName}</h2>
                  <p className="text-[12px] text-gray-400">{ROLE_LABELS[selectedUser?.role] || selectedUser?.role}</p>
                </div>
                <button onClick={save} disabled={saving || dirty.size === 0} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold bg-[#5E2CA5] hover:bg-[#4a2280] text-white shadow-sm transition-colors disabled:opacity-50">
                  <Save className="w-3.5 h-3.5"/> {saving ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>

              <div className="max-h-[calc(100vh-260px)] overflow-y-auto divide-y divide-gray-50 dark:divide-white/5">
                {MODULES.map((m) => (<div key={m.module} className="px-5 py-4">
                    <h3 className="text-[13px] font-semibold text-gray-800 dark:text-gray-100 mb-2.5">{m.moduleLabel}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                      {m.actions.map((a) => {
                    const on = isGranted(a.module, a.action);
                    const interactive = a.tier === "ready";
                    return (<label key={a.action} className={cn("flex items-center justify-between gap-2 py-1", interactive ? "cursor-pointer" : "cursor-not-allowed opacity-60")}>
                            <span className="flex items-center gap-2 min-w-0">
                              <input type="checkbox" checked={on} disabled={!interactive} onChange={() => toggle(a.module, a.action, a.tier)} className="h-4 w-4 accent-[#5E2CA5] rounded flex-shrink-0"/>
                              <span className="text-[13px] text-gray-700 dark:text-gray-300 truncate">{a.label}</span>
                            </span>
                            {a.tier !== "ready" && (<span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0", TIER_BADGE_CLS[a.tier])}>
                                {TIER_LABELS[a.tier]}
                              </span>)}
                          </label>);
                })}
                    </div>
                  </div>))}
              </div>
            </>)}
        </Card>
      </div>
    </div>);
}
