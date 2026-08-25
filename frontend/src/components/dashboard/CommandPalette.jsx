import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "@/lib/router";
import { Search, X, CornerDownLeft, ArrowUp, ArrowDown, LayoutDashboard, Users, GraduationCap, Presentation, ClipboardCheck, CalendarRange, ClipboardList, Trophy, BookOpen, Wallet, AlertCircle, Gift, PlusCircle, Banknote, TrendingDown, ArrowLeftRight, BarChart3, TrendingUp, FileBarChart, Bell, Settings, UserCog, ScrollText, Pin, } from "lucide-react";
import { cn, getInitials, formatPhone } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
const BRAND = "#5E2CA5";
const PAGES = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/leads", label: "Lidlar", icon: Users },
    { href: "/leads/kanban", label: "Kanban", icon: Pin },
    { href: "/students", label: "Talabalar", icon: GraduationCap },
    { href: "/groups", label: "Guruhlar", icon: GraduationCap },
    { href: "/teachers", label: "O'qituvchilar", icon: Presentation },
    { href: "/attendance", label: "Davomat", icon: ClipboardCheck },
    { href: "/timetable", label: "Dars jadvali", icon: CalendarRange },
    { href: "/exams", label: "Imtihonlar", icon: ClipboardList },
    { href: "/leaderboard", label: "Reyting", icon: Trophy },
    { href: "/courses", label: "Kurslar", icon: BookOpen },
    { href: "/payments", label: "To'lovlar", icon: Wallet },
    { href: "/debtors", label: "Qarzdorlar", icon: AlertCircle, keywords: "qarz debt" },
    { href: "/bonuses", label: "Bonuslar", icon: Gift },
    { href: "/incomes", label: "Qo'shimcha daromad", icon: PlusCircle },
    { href: "/payroll", label: "Ish haqi", icon: Banknote },
    { href: "/expenses", label: "Xarajatlar", icon: TrendingDown },
    { href: "/cashflow", label: "Pul oqimi", icon: ArrowLeftRight },
    { href: "/reports", label: "Hisobotlar", icon: BarChart3 },
    { href: "/analytics", label: "Analitika", icon: TrendingUp },
    { href: "/teacher-report", label: "O'qituvchi hisoboti", icon: FileBarChart },
    { href: "/reminders", label: "Eslatmalar", icon: Bell },
    { href: "/settings", label: "Sozlamalar", icon: Settings },
    { href: "/users", label: "Hodimlar", icon: UserCog },
    { href: "/logs", label: "Jurnallar", icon: ScrollText },
];
export default function CommandPalette() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [leads, setLeads] = useState([]);
    const [groups, setGroups] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [searching, setSearching] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef(null);
    const close = useCallback(() => {
        setOpen(false);
        setQuery("");
        setLeads([]);
        setActiveIndex(0);
    }, []);
    // Lazily load groups + teachers once (small, mostly-static lists) on first open
    useEffect(() => {
        if (!open || groups.length || teachers.length)
            return;
        apiFetch("/api/groups?limit=500").then((r) => r.json()).then((d) => setGroups(Array.isArray(d?.groups) ? d.groups : [])).catch(() => { });
        apiFetch("/api/teachers").then((r) => r.json()).then((d) => setTeachers(Array.isArray(d) ? d : [])).catch(() => { });
    }, [open, groups.length, teachers.length]);
    // Global Ctrl+K / Cmd+K shortcut + Escape
    useEffect(() => {
        const onKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setOpen((o) => !o);
            }
            else if (e.key === "Escape" && open) {
                close();
            }
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [open, close]);
    // Autofocus input when opened
    useEffect(() => {
        if (open) {
            const t = setTimeout(() => inputRef.current?.focus(), 30);
            return () => clearTimeout(t);
        }
    }, [open]);
    // Debounced lead search
    useEffect(() => {
        if (!open || query.trim().length < 2) {
            setLeads([]);
            return;
        }
        setSearching(true);
        const controller = new AbortController();
        const t = setTimeout(async () => {
            try {
                const res = await apiFetch(`/api/leads?search=${encodeURIComponent(query.trim())}&limit=6`, { signal: controller.signal });
                if (res.ok) {
                    const data = await res.json();
                    setLeads(data.leads || []);
                }
            }
            catch (err) {
                if (err.name !== "AbortError")
                    throw err;
            }
            finally {
                setSearching(false);
            }
        }, 150);
        return () => { clearTimeout(t); controller.abort(); };
    }, [query, open]);
    const q = query.trim().toLowerCase();
    const pageMatches = PAGES.filter((p) => {
        if (!q)
            return true;
        return p.label.toLowerCase().includes(q) || p.keywords?.toLowerCase().includes(q);
    }).slice(0, q ? 8 : 6);
    const leadMatches = leads.filter((l) => l.status !== "ENROLLED");
    const studentMatches = leads.filter((l) => l.status === "ENROLLED");
    const groupMatches = q
        ? groups.filter((g) => g.name.toLowerCase().includes(q) || g.course?.name.toLowerCase().includes(q)).slice(0, 6)
        : [];
    const teacherMatches = q
        ? teachers.filter((t) => t.fullName.toLowerCase().includes(q) || t.subject?.toLowerCase().includes(q)).slice(0, 6)
        : [];
    const pageItems = pageMatches.map((p) => ({ type: "page", key: `page-${p.href}`, href: p.href, label: p.label, icon: p.icon }));
    const leadItems = leadMatches.map((l) => ({
        type: "lead",
        key: `lead-${l.id}`,
        href: `/leads/${l.id}`,
        label: l.fullName,
        sub: l.course?.name || formatPhone(l.phone),
    }));
    const studentItems = studentMatches.map((l) => ({
        type: "student",
        key: `student-${l.id}`,
        href: `/leads/${l.id}`,
        label: l.fullName,
        sub: l.course?.name || formatPhone(l.phone),
    }));
    const groupItems = groupMatches.map((g) => ({
        type: "group",
        key: `group-${g.id}`,
        href: `/groups`,
        label: g.name,
        sub: g.course?.name || g.teacher?.fullName || "Guruh",
    }));
    const teacherItems = teacherMatches.map((t) => ({
        type: "teacher",
        key: `teacher-${t.id}`,
        href: `/teachers`,
        label: t.fullName,
        sub: t.subject || "O'qituvchi",
    }));
    const results = [...pageItems, ...leadItems, ...studentItems, ...groupItems, ...teacherItems];
    useEffect(() => { setActiveIndex(0); }, [query, leads.length, groups.length, teachers.length]);
    const navigateTo = (href) => {
        router.push(href);
        close();
    };
    const onKeyDown = (e) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, results.length - 1));
        }
        else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
        }
        else if (e.key === "Enter") {
            e.preventDefault();
            const item = results[activeIndex];
            if (item)
                navigateTo(item.href);
        }
    };
    if (!open)
        return null;
    return (<div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 pt-[12vh] animate-modal-overlay" onClick={close}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-modal-content" style={{ fontFamily: "'Inter', sans-serif" }} onClick={(e) => e.stopPropagation()}>
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-white/10">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0"/>
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onKeyDown} placeholder="Lid, talaba, guruh, o'qituvchi yoki sahifa qidirish..." className="flex-1 text-[14px] bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400"/>
          {searching && (<div className="w-3.5 h-3.5 border-2 border-gray-200 border-t-[#5E2CA5] rounded-full animate-spin flex-shrink-0"/>)}
          <button onClick={close} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors flex-shrink-0">
            <X className="w-4 h-4"/>
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-1.5">
          {results.length === 0 ? (<p className="px-4 py-8 text-center text-[13px] text-gray-400">
              {query.trim() ? "Hech narsa topilmadi" : "Yozishni boshlang..."}
            </p>) : (<>
              {pageMatches.length > 0 && (<p className="px-4 pt-2 pb-1 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                  Sahifalar
                </p>)}
              {pageMatches.map((p, idx) => {
                const Icon = p.icon;
                const isActive = idx === activeIndex;
                return (<button key={`page-${p.href}`} onMouseEnter={() => setActiveIndex(idx)} onClick={() => navigateTo(p.href)} className={cn("w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors", isActive ? "bg-[#5E2CA5]/8 dark:bg-[#5E2CA5]/15" : "hover:bg-gray-50 dark:hover:bg-white/5")}>
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", isActive ? "bg-[#5E2CA5] text-white" : "bg-gray-100 dark:bg-white/8 text-gray-500 dark:text-gray-400")}>
                      <Icon className="w-4 h-4"/>
                    </div>
                    <span className={cn("text-[13px] font-medium truncate", isActive ? "text-[#5E2CA5] dark:text-purple-300" : "text-gray-700 dark:text-gray-200")}>
                      {p.label}
                    </span>
                  </button>);
            })}

              {(() => {
                const base = pageItems.length;
                const sections = [
                    { title: "Lidlar", items: leadItems, offset: base },
                    { title: "Talabalar", items: studentItems, offset: base + leadItems.length },
                    { title: "Guruhlar", items: groupItems, offset: base + leadItems.length + studentItems.length },
                    { title: "O'qituvchilar", items: teacherItems, offset: base + leadItems.length + studentItems.length + groupItems.length },
                ];
                return sections.map((section) => section.items.length === 0 ? null : (<div key={section.title}>
                      <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                        {section.title}
                      </p>
                      {section.items.map((item, i) => {
                        const idx = section.offset + i;
                        const isActive = idx === activeIndex;
                        const isPerson = item.type !== "group";
                        return (<button key={item.key} onMouseEnter={() => setActiveIndex(idx)} onClick={() => navigateTo(item.href)} className={cn("w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors", isActive ? "bg-[#5E2CA5]/8 dark:bg-[#5E2CA5]/15" : "hover:bg-gray-50 dark:hover:bg-white/5")}>
                            {isPerson ? (<div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: BRAND }}>
                                {getInitials(item.label)}
                              </div>) : (<div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", isActive ? "bg-[#5E2CA5] text-white" : "bg-gray-100 dark:bg-white/8 text-gray-500 dark:text-gray-400")}>
                                <GraduationCap className="w-4 h-4"/>
                              </div>)}
                            <div className="min-w-0 flex-1">
                              <p className={cn("text-[13px] font-medium truncate", isActive ? "text-[#5E2CA5] dark:text-purple-300" : "text-gray-900 dark:text-white")}>
                                {item.label}
                              </p>
                              <p className="text-[11px] text-gray-400 truncate">{item.sub}</p>
                            </div>
                          </button>);
                    })}
                    </div>));
            })()}
            </>)}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-gray-100 dark:border-white/10 text-[11px] text-gray-400">
          <span className="flex items-center gap-1">
            <ArrowUp className="w-3 h-3"/><ArrowDown className="w-3 h-3"/> tanlash
          </span>
          <span className="flex items-center gap-1">
            <CornerDownLeft className="w-3 h-3"/> o&apos;tish
          </span>
          <span className="flex items-center gap-1 ml-auto">
            <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 font-mono text-[10px]">Esc</kbd> yopish
          </span>
        </div>
      </div>
    </div>);
}
