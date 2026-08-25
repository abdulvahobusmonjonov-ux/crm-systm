import { useState, useEffect, useRef } from "react";
import { Moon, Sun, Search, Plus, Menu, LogOut, Settings, CalendarRange } from "lucide-react";
import { useRouter } from "@/lib/router";
import { signOut, useSession } from "@/lib/session";
import Link from "@/components/ui/link";
import { cn, getInitials, formatPhone } from "@/lib/utils";
import { useDarkMode } from "@/hooks/useDarkMode";
import NotificationBell from "@/components/dashboard/NotificationBell";
import { apiFetch } from "@/lib/api";
export default function Topbar({ onMenuClick }) {
    const router = useRouter();
    const { data: session } = useSession();
    const { dark, toggleDark } = useDarkMode();
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searching, setSearching] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const searchBoxRef = useRef(null);
    const searchInputRef = useRef(null);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);
    const user = session?.user;
    useEffect(() => {
        const onClickOutside = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setUserMenuOpen(false);
            }
            if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
                setSearchOpen(false);
            }
        };
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);
    // Live, debounced search across leads + students (by name or phone)
    useEffect(() => {
        const q = search.trim();
        if (q.length < 2) {
            setSearchResults([]);
            setSearching(false);
            return;
        }
        setSearching(true);
        const controller = new AbortController();
        const t = setTimeout(async () => {
            try {
                const res = await apiFetch(`/api/leads?search=${encodeURIComponent(q)}&limit=8`, { signal: controller.signal });
                if (res.ok) {
                    const data = await res.json();
                    setSearchResults(data.leads || []);
                    setSearchOpen(true);
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
    }, [search]);
    useEffect(() => { setActiveIndex(0); }, [searchResults]);
    const goToLead = (id) => {
        router.push(`/leads/${id}`);
        setSearch("");
        setSearchResults([]);
        setSearchOpen(false);
    };
    const onSearchKeyDown = (e) => {
        if (e.key === "Escape") {
            setSearchOpen(false);
            searchInputRef.current?.blur();
            return;
        }
        if (!searchOpen || searchResults.length === 0) {
            if (e.key === "Enter" && search.trim()) {
                e.preventDefault();
                router.push(`/leads?search=${encodeURIComponent(search.trim())}`);
                setSearch("");
                setSearchOpen(false);
            }
            return;
        }
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, searchResults.length - 1));
        }
        else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
        }
        else if (e.key === "Enter") {
            e.preventDefault();
            const item = searchResults[activeIndex];
            if (item)
                goToLead(item.id);
        }
    };
    return (<header className="h-16 border-b border-gray-100 dark:border-white/10 bg-white dark:bg-gray-900 flex items-center px-3 sm:px-5 gap-3 sm:gap-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Hamburger (mobile) */}
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors flex-shrink-0" aria-label="Menyu">
        <Menu className="w-5 h-5"/>
      </button>

      {/* Search — centered in the space between hamburger and right cluster */}
      <div className="hidden sm:flex flex-1 justify-center px-4">
        <div className="relative w-full max-w-xs lg:max-w-sm" ref={searchBoxRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
            <input ref={searchInputRef} value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={onSearchKeyDown} onFocus={() => { if (searchResults.length)
        setSearchOpen(true); }} type="text" placeholder="Qidirish..." className="w-full pl-9 pr-8 py-2 text-[13px] border border-gray-200 dark:border-white/10 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 focus:border-[#5E2CA5]/50 transition"/>
            {searching && (<div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-gray-200 dark:border-white/10 border-t-[#5E2CA5] rounded-full animate-spin"/>)}
          </div>

          {searchOpen && search.trim().length >= 2 && (<div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 z-50 overflow-hidden py-1.5 max-h-96 overflow-y-auto">
              {searchResults.length === 0 ? (<p className="px-4 py-6 text-center text-[13px] text-gray-400">
                  {searching ? "Qidirilmoqda..." : "Hech narsa topilmadi"}
                </p>) : (searchResults.map((lead, idx) => {
                const isActive = idx === activeIndex;
                const isStudent = lead.status === "ENROLLED";
                return (<button key={lead.id} onMouseEnter={() => setActiveIndex(idx)} onClick={() => goToLead(lead.id)} className={cn("w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors", isActive ? "bg-[#5E2CA5]/8 dark:bg-[#5E2CA5]/15" : "hover:bg-gray-50 dark:hover:bg-white/5")}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: "#5E2CA5" }}>
                        {getInitials(lead.fullName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-[13px] font-medium truncate", isActive ? "text-[#5E2CA5] dark:text-purple-300" : "text-gray-900 dark:text-white")}>
                          {lead.fullName}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">{formatPhone(lead.phone)}</p>
                      </div>
                      <span className={cn("flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full", isStudent
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : "bg-[#5E2CA5]/10 text-[#5E2CA5] dark:bg-[#5E2CA5]/20 dark:text-purple-300")}>
                        {isStudent ? "Talaba" : "Lid"}
                      </span>
                    </button>);
            }))}
            </div>)}
        </div>
      </div>

      {/* Right-side cluster */}
      <div className="flex items-center gap-2 sm:gap-3 ml-auto sm:ml-0">
        {/* Quick add lead */}
        <Link href="/leads/new" className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-[#5E2CA5] hover:bg-[#4a2280] text-white text-[13px] font-medium rounded-xl transition-colors flex-shrink-0">
          <Plus className="w-4 h-4"/>
          Yangi lid
        </Link>
        <Link href="/leads/new" className="md:hidden flex items-center justify-center w-9 h-9 bg-[#5E2CA5] hover:bg-[#4a2280] text-white rounded-xl transition-colors flex-shrink-0" aria-label="Yangi lid">
          <Plus className="w-4 h-4"/>
        </Link>

        {/* Dars jadvali */}
        <Link href="/timetable" className="p-2.5 rounded-xl text-gray-500 hover:bg-[#5E2CA5]/10 hover:text-[#5E2CA5] dark:hover:bg-[#5E2CA5]/20 dark:hover:text-purple-300 transition-colors flex-shrink-0" title="Dars jadvali" aria-label="Dars jadvali">
          <CalendarRange className="w-[22px] h-[22px]"/>
        </Link>

        {/* Dark mode toggle */}
        <button onClick={toggleDark} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors flex-shrink-0" title={dark ? "Yorug' rejim" : "Qorong'i rejim"}>
          {dark ? <Sun className="w-5 h-5"/> : <Moon className="w-5 h-5"/>}
        </button>

        {/* Bell / notifications */}
        <NotificationBell />

        {/* Divider */}
        <div className="hidden sm:block w-px h-6 bg-gray-100 dark:bg-white/10 flex-shrink-0"/>

        {/* User avatar / menu */}
        <div className="relative flex-shrink-0" ref={userMenuRef}>
          <button onClick={() => setUserMenuOpen((o) => !o)} className="flex items-center gap-2 p-1 pr-1.5 sm:pr-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
            <div className="w-8 h-8 rounded-full bg-[#5E2CA5]/10 dark:bg-[#5E2CA5]/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {user?.avatarUrl ? (
        <img src={user.avatarUrl} alt="" className="w-full h-full object-cover"/>) : (<span className="text-[11px] font-semibold text-[#5E2CA5] dark:text-purple-300">
                  {user ? getInitials(user.fullName ?? user.name ?? "U") : "U"}
                </span>)}
            </div>
            <div className="hidden sm:block text-left min-w-0">
              <p className="text-[12px] font-medium text-gray-900 dark:text-white leading-tight truncate max-w-[110px]">
                {user?.fullName ?? user?.name ?? "Foydalanuvchi"}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{user?.role}</p>
            </div>
          </button>

          {userMenuOpen && (<div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 z-50 overflow-hidden py-1.5">
              <div className="px-3.5 py-2 border-b border-gray-100 dark:border-white/10 mb-1">
                <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">
                  {user?.fullName ?? user?.name}
                </p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{user?.role}</p>
              </div>
              <Link href="/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <Settings className="w-4 h-4 text-gray-400"/>
                Sozlamalar
              </Link>
              <button onClick={() => signOut({ callbackUrl: "/login" })} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                <LogOut className="w-4 h-4"/>
                Chiqish
              </button>
            </div>)}
        </div>
      </div>
    </header>);
}
