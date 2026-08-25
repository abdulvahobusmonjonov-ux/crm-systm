"use client";

import { useState, useEffect, useRef } from "react";
import { Moon, Sun, Menu, LogOut, UserCog } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { getInitials } from "@/lib/utils";
import { useDarkMode } from "@/hooks/useDarkMode";

interface SessionUser {
  fullName?: string;
  name?: string;
  avatarUrl?: string | null;
}

interface PortalTopbarProps {
  portalLabel: string;
  profileHref: string;
  onMenuClick?: () => void;
}

export default function PortalTopbar({ portalLabel, profileHref, onMenuClick }: PortalTopbarProps) {
  const { data: session } = useSession();
  const { dark, toggleDark } = useDarkMode();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const user = session?.user as SessionUser | undefined;

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <header
      className="h-16 border-b border-gray-100 dark:border-white/10 bg-white dark:bg-gray-900 flex items-center px-3 sm:px-5 gap-3 sm:gap-5"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors flex-shrink-0" aria-label="Menyu">
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-2 sm:gap-3">
        <button onClick={toggleDark} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors flex-shrink-0" title={dark ? "Yorug' rejim" : "Qorong'i rejim"}>
          {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="hidden sm:block w-px h-6 bg-gray-100 dark:bg-white/10 flex-shrink-0" />

        <div className="relative flex-shrink-0" ref={userMenuRef}>
          <button onClick={() => setUserMenuOpen((o) => !o)} className="flex items-center gap-2 p-1 pr-1.5 sm:pr-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
            <div className="w-8 h-8 rounded-full bg-[#5E2CA5]/10 dark:bg-[#5E2CA5]/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[11px] font-semibold text-[#5E2CA5] dark:text-purple-300">{user ? getInitials(user.fullName ?? user.name ?? "U") : "U"}</span>
              )}
            </div>
            <div className="hidden sm:block text-left min-w-0">
              <p className="text-[12px] font-medium text-gray-900 dark:text-white leading-tight truncate max-w-[110px]">{user?.fullName ?? user?.name ?? "Foydalanuvchi"}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{portalLabel}</p>
            </div>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 z-50 overflow-hidden py-1.5">
              <div className="px-3.5 py-2 border-b border-gray-100 dark:border-white/10 mb-1">
                <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">{user?.fullName ?? user?.name}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{portalLabel}</p>
              </div>
              <Link href={profileHref} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <UserCog className="w-4 h-4 text-gray-400" />
                Profil
              </Link>
              <button onClick={() => signOut({ callbackUrl: "/login" })} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                <LogOut className="w-4 h-4" />
                Chiqish
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
