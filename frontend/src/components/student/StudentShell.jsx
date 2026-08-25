import { useEffect, useState } from "react";
import { signOut, useSession } from "@/lib/session";
import { Moon, Sun, LogOut } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { useDarkMode } from "@/hooks/useDarkMode";
import { apiFetch, LOGO_URL } from "@/lib/api";
export default function StudentShell({ children }) {
    const { data: session } = useSession();
    const { dark, toggleDark } = useDarkMode();
    const [logo, setLogo] = useState("");
    useEffect(() => {
        apiFetch("/api/branding")
            .then((r) => r.json())
            .then((d) => { if (d.logo)
            setLogo(d.logo); })
            .catch(() => { });
    }, []);
    const fullName = session?.user?.fullName ?? "O'quvchi";
    return (<div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="h-16 border-b border-gray-100 dark:border-white/10 bg-white dark:bg-gray-900 flex items-center px-3 sm:px-5 gap-3" style={{ fontFamily: "'Inter', sans-serif" }}>
        <img src={logo || LOGO_URL} alt="Logo" className="w-8 h-8 rounded-xl object-contain flex-shrink-0"/>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight truncate">Robocode IT Academy</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">O&apos;quvchi kabineti</p>
        </div>
        <button onClick={toggleDark} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors flex-shrink-0">
          {dark ? <Sun className="w-5 h-5"/> : <Moon className="w-5 h-5"/>}
        </button>
        <div className="w-8 h-8 rounded-full bg-[#5E2CA5]/10 dark:bg-[#5E2CA5]/20 flex items-center justify-center flex-shrink-0">
          <span className="text-[11px] font-semibold text-[#5E2CA5] dark:text-purple-300">{getInitials(fullName)}</span>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/login" })} className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex-shrink-0" title="Chiqish">
          <LogOut className="w-[18px] h-[18px]"/>
        </button>
      </header>
      <main>{children}</main>
    </div>);
}
