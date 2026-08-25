import { useState, useEffect } from "react";
import Link from "@/components/ui/link";
import { usePathname } from "@/lib/router";
import { signOut, useSession } from "@/lib/session";
import { LayoutDashboard, GraduationCap, ClipboardList, UserCog, BarChart3, MessageCircle, LogOut, ChevronLeft, ChevronRight, X, } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { apiFetch, LOGO_URL } from "@/lib/api";
const navItems = [
    { href: "/teacher/dashboard", label: "Asosiy", icon: LayoutDashboard },
    { href: "/teacher/students", label: "O'quvchilar", icon: GraduationCap },
    { href: "/teacher/homework", label: "Uy vazifalari", icon: ClipboardList },
    { href: "/teacher/profile", label: "Profil", icon: UserCog },
];
const soonItems = [
    { label: "Statistika", icon: BarChart3 },
    { label: "Chat", icon: MessageCircle },
];
const isActivePath = (href, pathname) => pathname === href || pathname.startsWith(href + "/");
const ICON = "w-[18px] h-[18px] flex-shrink-0";
export default function TeacherSidebar({ mobileOpen = false, onClose = () => { } }) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [collapsed, setCollapsed] = useState(false);
    const [logo, setLogo] = useState("");
    useEffect(() => {
        apiFetch("/api/branding")
            .then((r) => r.json())
            .then((d) => { if (d.logo)
            setLogo(d.logo); })
            .catch(() => { });
    }, []);
    useEffect(() => { onClose(); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps
    const user = session?.user;
    const linkCls = (href) => cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors duration-150", isActivePath(href, pathname)
        ? "bg-[#5E2CA5] text-white shadow-sm"
        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white");
    return (<>
      {mobileOpen && (<div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose}/>)}

      <aside className={cn("fixed inset-y-0 left-0 z-50 flex flex-col h-full w-64 bg-white dark:bg-gray-950 border-r border-gray-100 dark:border-white/5 transition-transform duration-300 lg:relative lg:inset-auto lg:translate-x-0 lg:transition-[width] lg:duration-300", mobileOpen ? "translate-x-0" : "-translate-x-full", collapsed ? "lg:w-[68px]" : "lg:w-64")} style={{ fontFamily: "'Inter', sans-serif" }}>
        {/* Logo */}
        <div className={cn("flex items-center h-16 border-b border-gray-100 dark:border-white/5", collapsed ? "lg:justify-center lg:px-0 px-4 gap-3" : "px-4 gap-3")}>
          <img src={logo || LOGO_URL} alt="Logo" className="w-8 h-8 rounded-xl object-contain flex-shrink-0"/>
          <div className={cn("min-w-0 flex-1", collapsed && "lg:hidden")}>
            <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight truncate">
              Robocode IT Academy
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">O&apos;qituvchi paneli</p>
          </div>
          <button onClick={onClose} className="lg:hidden p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-600 transition-colors flex-shrink-0">
            <X className="w-5 h-5"/>
          </button>
        </div>

        <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex absolute -right-3 top-[72px] z-10 w-6 h-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-full items-center justify-center shadow-sm hover:shadow-md hover:border-[#5E2CA5]/40 transition-all duration-150">
          {collapsed ? (<ChevronRight className="w-3 h-3 text-gray-400"/>) : (<ChevronLeft className="w-3 h-3 text-gray-400"/>)}
        </button>

        {/* Navigation */}
        <nav className="flex-1 px-2.5 py-4 overflow-y-auto space-y-0.5 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (<Link key={item.href} href={item.href} title={collapsed ? item.label : undefined} className={linkCls(item.href)}>
                <Icon className={ICON}/>
                {!collapsed && <span>{item.label}</span>}
  </Link>);
        })}

          {/* "Tez kunda" placeholders */}
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5 space-y-0.5">
            {soonItems.map((item) => {
            const Icon = item.icon;
            return (<div key={item.label} title={collapsed ? item.label : undefined} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-gray-300 dark:text-gray-600 cursor-not-allowed">
                  <Icon className={ICON}/>
                  {!collapsed && (<span className="flex-1 flex items-center justify-between gap-2">
                      {item.label}
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500">
                        Tez kunda
                      </span>
                    </span>)}
                </div>);
        })}
          </div>
        </nav>

        {/* User profile */}
        <div className="border-t border-gray-100 dark:border-white/5 p-3">
          <div className={cn("flex items-center gap-2.5", collapsed && "justify-center")}>
            <Link href="/teacher/profile" title="Profil" className={cn("flex items-center gap-2.5 min-w-0 flex-1 rounded-xl -m-1 p-1 transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-white/5", collapsed && "flex-initial justify-center")}>
              <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-[#5E2CA5]/10 dark:bg-[#5E2CA5]/20 flex items-center justify-center overflow-hidden">
                {user?.avatarUrl ? (
        <img src={user.avatarUrl} alt="" className="w-full h-full object-cover"/>) : (<span className="text-xs font-semibold text-[#5E2CA5] dark:text-purple-400">
                    {user ? getInitials(user.fullName ?? user.name ?? "U") : "U"}
                  </span>)}
              </div>
              {!collapsed && (<div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate leading-tight">
                    {user?.fullName ?? user?.name}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">O&apos;qituvchi</p>
                </div>)}
            </Link>
            {!collapsed && (<button onClick={() => signOut({ callbackUrl: "/login" })} className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors duration-150" title="Chiqish">
                <LogOut className="w-[15px] h-[15px]"/>
              </button>)}
          </div>
          {collapsed && (<button onClick={() => signOut({ callbackUrl: "/login" })} className="mt-2 w-full flex justify-center p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors duration-150" title="Chiqish">
              <LogOut className="w-[15px] h-[15px]"/>
            </button>)}
        </div>
      </aside>
    </>);
}
