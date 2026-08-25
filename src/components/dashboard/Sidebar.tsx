"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  type LucideIcon,
  LayoutDashboard,
  Users,
  BookOpen,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  GraduationCap,
  UserCog,
  Pin,
  Wallet,
  TrendingUp,
  Presentation,
  CalendarRange,
  TrendingDown,
  PlusCircle,
  Banknote,
  ArrowLeftRight,
  ClipboardList,
  Trophy,
  ScrollText,
  FileBarChart,
  AlertCircle,
  Gift,
  UserCheck,
  CheckSquare,
  Briefcase,
  ShieldCheck,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon };
type NavEntry =
  | { type: "item"; href: string; label: string; icon: LucideIcon; children?: NavItem[]; visible?: (u: NavUser) => boolean }
  | { type: "group"; label: string; icon: LucideIcon; children: NavItem[]; visible?: (u: NavUser) => boolean };

interface NavUser {
  role?: string;
  canManageLeads?: boolean;
  canManageUsers?: boolean;
  canViewReports?: boolean;
  canSeeReports?: boolean;
  canSeePayments?: boolean;
  canManagePayments?: boolean;
  canManageExpenses?: boolean;
}

const isAdminRole = (u: NavUser) => u.role === "SUPER_ADMIN" || u.role === "ADMIN";
const isManagerRole = (u: NavUser) => isAdminRole(u) || u.role === "MANAGER";

// Sozlamalar, Hodimlar boshqaruvi kabi nozik bo'limlar faqat tegishli huquqi borlarga
// ko'rinadi — qolganlari (Lidlar, Guruhlar va h.k.) barcha xodimlar uchun ochiq qoladi.
const navEntries: NavEntry[] = [
  { type: "item", href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    type: "item",
    href: "/leads",
    label: "Lidlar",
    icon: Users,
    children: [
      { href: "/leads/kanban", label: "Kanban", icon: Pin },
    ],
  },
  { type: "item", href: "/students", label: "Talabalar", icon: GraduationCap },
  { type: "item", href: "/groups", label: "Guruhlar", icon: GraduationCap },
  { type: "item", href: "/teachers", label: "O'qituvchilar", icon: Presentation },
  {
    type: "group",
    label: "O'quv jarayoni",
    icon: BookOpen,
    children: [
      { href: "/timetable", label: "Dars jadvali", icon: CalendarRange },
      { href: "/exams", label: "Imtihonlar", icon: ClipboardList },
      { href: "/leaderboard", label: "Reyting", icon: Trophy },
      { href: "/courses", label: "Kurslar", icon: BookOpen },
    ],
  },
  {
    type: "group",
    label: "Moliya",
    icon: Wallet,
    visible: (u) => isManagerRole(u) || !!u.canSeePayments || !!u.canManagePayments || !!u.canManageExpenses,
    children: [
      { href: "/payments", label: "To'lovlar", icon: Wallet },
      { href: "/debtors", label: "Qarzdorlar", icon: AlertCircle },
      { href: "/bonuses", label: "Bonuslar", icon: Gift },
      { href: "/incomes", label: "Qo'shimcha daromad", icon: PlusCircle },
      { href: "/payroll", label: "Ish haqi", icon: Banknote },
      { href: "/expenses", label: "Xarajatlar", icon: TrendingDown },
      { href: "/cashflow", label: "Pul oqimi", icon: ArrowLeftRight },
    ],
  },
  {
    type: "group",
    label: "Hisobotlar",
    icon: BarChart3,
    visible: (u) => isManagerRole(u) || !!u.canViewReports || !!u.canSeeReports,
    children: [
      { href: "/reports", label: "Hisobotlar", icon: BarChart3 },
      { href: "/analytics", label: "Analitika", icon: TrendingUp },
      { href: "/teacher-report", label: "O'qituvchi hisoboti", icon: FileBarChart },
    ],
  },
  { type: "item", href: "/reminders", label: "Eslatmalar", icon: Bell },
  {
    type: "group",
    label: "Boshqaruv",
    icon: Briefcase,
    visible: (u) => isManagerRole(u) || !!u.canManageUsers,
    children: [
      { href: "/staff-attendance", label: "Xodimlar davomati", icon: UserCheck },
      { href: "/tasks", label: "Vazifalar", icon: CheckSquare },
    ],
  },
  {
    type: "group",
    label: "Sozlamalar",
    icon: Settings,
    visible: (u) => isAdminRole(u) || !!u.canManageUsers,
    children: [
      { href: "/settings", label: "Sozlamalar", icon: Settings },
      { href: "/users", label: "Hodimlar", icon: UserCog },
      { href: "/permissions", label: "Rollar va ruxsatlar", icon: ShieldCheck },
      { href: "/logs", label: "Jurnallar", icon: ScrollText },
    ],
  },
];

const isActivePath = (href: string, pathname: string): boolean =>
  pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

const hasActiveChild = (children: NavItem[], pathname: string): boolean =>
  children.some((c) => isActivePath(c.href, pathname));

const initOpenGroups = (pathname: string): Record<string, boolean> => {
  const result: Record<string, boolean> = {};
  for (const entry of navEntries) {
    if (entry.type === "group") {
      result[entry.label] = hasActiveChild(entry.children, pathname);
    } else if (entry.children) {
      result[entry.label] = hasActiveChild(entry.children, pathname);
    }
  }
  return result;
};

interface SessionUser extends NavUser {
  fullName?: string;
  name?: string;
  role?: string;
  avatarUrl?: string | null;
}

const ICON = "w-[18px] h-[18px] flex-shrink-0";

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ mobileOpen = false, onClose = () => {} }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [logo, setLogo] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    () => initOpenGroups(pathname)
  );

  useEffect(() => {
    fetch("/api/branding")
      .then((r) => r.json())
      .then((d: { logo?: string }) => { if (d.logo) setLogo(d.logo); })
      .catch(() => {});
  }, []);

  useEffect(() => { onClose(); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const user = session?.user as SessionUser | undefined;
  const visibleNavEntries = navEntries.filter((entry) => !entry.visible || entry.visible(user ?? {}));

  const toggle = (key: string) =>
    setOpenGroups((prev) => {
      if (prev[key]) return { ...prev, [key]: false };
      const next: Record<string, boolean> = {};
      for (const k of Object.keys(prev)) next[k] = false;
      next[key] = true;
      return next;
    });

  const chevronStyle = (open: boolean): React.CSSProperties => ({
    transform: open ? "rotate(0deg)" : "rotate(-90deg)",
    transition: "transform 200ms ease",
  });

  const topLinkCls = (href: string) =>
    cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors duration-150",
      isActivePath(href, pathname)
        ? "bg-[#5E2CA5] text-white shadow-sm"
        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
    );

  const childLinkCls = (href: string) => {
    const active = isActivePath(href, pathname);
    return cn(
      "flex items-center gap-3 pl-2.5 pr-3 py-2 rounded-lg text-[13px] font-medium transition-colors duration-150 border-l-2",
      active
        ? "border-[#5E2CA5] text-[#5E2CA5] dark:text-purple-400 bg-purple-50 dark:bg-[#5E2CA5]/10"
        : "border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-gray-200"
    );
  };

  const renderNavItem = (item: NavItem, inGroup = false) => {
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        title={collapsed ? item.label : undefined}
        className={inGroup ? childLinkCls(item.href) : topLinkCls(item.href)}
      >
        <Icon className={ICON} />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  const renderNavEntry = (entry: NavEntry) => {
    if (entry.type === "group") {
      const open = openGroups[entry.label] ?? true;
      const Icon = entry.icon;

      if (collapsed) {
        return (
          <div key={entry.label} className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
            <div className="flex justify-center mb-1" title={entry.label}>
              <Icon className="w-3 h-3 text-gray-300 dark:text-gray-600" />
            </div>
            <div className="space-y-0.5">
              {entry.children.map((item) => renderNavItem(item))}
            </div>
          </div>
        );
      }

      const activeInGroup = !open && hasActiveChild(entry.children, pathname);
      return (
        <div key={entry.label}>
          <button
            onClick={() => toggle(entry.label)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors duration-150",
              activeInGroup
                ? "bg-[#5E2CA5] text-white shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            <Icon className={ICON} />
            <span className="flex-1 text-left">{entry.label}</span>
            <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" style={chevronStyle(open)} />
          </button>
          {open && (
            <div className="mt-1 space-y-0.5 ml-1">
              {entry.children.map((item) => renderNavItem(item, true))}
            </div>
          )}
        </div>
      );
    }

    const Icon = entry.icon;

    if (!entry.children) {
      return (
        <Link
          key={entry.href}
          href={entry.href}
          title={collapsed ? entry.label : undefined}
          className={topLinkCls(entry.href)}
        >
          <Icon className={ICON} />
          {!collapsed && <span>{entry.label}</span>}
        </Link>
      );
    }

    const open = openGroups[entry.label] ?? true;
    return (
      <div key={entry.href}>
        <div className={cn("flex items-center", !collapsed && "gap-0.5")}>
          <Link
            href={entry.href}
            title={collapsed ? entry.label : undefined}
            className={cn(topLinkCls(entry.href), "flex-1")}
          >
            <Icon className={ICON} />
            {!collapsed && <span>{entry.label}</span>}
          </Link>
          {!collapsed && (
            <button
              onClick={() => toggle(entry.label)}
              className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-150"
            >
              <ChevronDown className="w-3.5 h-3.5" style={chevronStyle(open)} />
            </button>
          )}
        </div>
        {open && !collapsed && (
          <div className="mt-1 space-y-0.5 ml-1 pl-3 border-l-2 border-gray-100 dark:border-white/5">
            {entry.children.map((item) => renderNavItem(item, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col h-full w-64 bg-white dark:bg-gray-950 border-r border-gray-100 dark:border-white/5 transition-transform duration-300 lg:relative lg:inset-auto lg:translate-x-0 lg:transition-[width] lg:duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          collapsed ? "lg:w-[68px]" : "lg:w-64"
        )}
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center h-16 border-b border-gray-100 dark:border-white/5",
          collapsed ? "lg:justify-center lg:px-0 px-4 gap-3" : "px-4 gap-3"
        )}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo || "/api/branding/logo"}
            alt="Logo"
            className="w-8 h-8 rounded-xl object-contain flex-shrink-0"
          />
          <div className={cn("min-w-0 flex-1", collapsed && "lg:hidden")}>
            <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight truncate">
              Robocode IT Academy
            </p>
          </div>
          {/* Mobile close */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-[72px] z-10 w-6 h-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-full items-center justify-center shadow-sm hover:shadow-md hover:border-[#5E2CA5]/40 transition-all duration-150"
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3 text-gray-400" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-gray-400" />
          )}
        </button>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 py-4 overflow-y-auto space-y-0.5 scrollbar-none">
        {visibleNavEntries.map(renderNavEntry)}
      </nav>

      {/* User profile */}
      <div className="border-t border-gray-100 dark:border-white/5 p-3">
        <div className={cn("flex items-center gap-2.5", collapsed && "justify-center")}>
          <Link
            href="/profile"
            title="Profil"
            className={cn(
              "flex items-center gap-2.5 min-w-0 flex-1 rounded-xl -m-1 p-1 transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-white/5",
              collapsed && "flex-initial justify-center"
            )}
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-[#5E2CA5]/10 dark:bg-[#5E2CA5]/20 flex items-center justify-center overflow-hidden">
              {user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-semibold text-[#5E2CA5] dark:text-purple-400">
                  {user ? getInitials(user.fullName ?? user.name ?? "U") : "U"}
                </span>
              )}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate leading-tight">
                  {user?.fullName ?? user?.name}
                </p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{user?.role}</p>
              </div>
            )}
          </Link>
          {!collapsed && (
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors duration-150"
              title="Chiqish"
            >
              <LogOut className="w-[15px] h-[15px]" />
            </button>
          )}
        </div>
        {collapsed && (
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-2 w-full flex justify-center p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors duration-150"
            title="Chiqish"
          >
            <LogOut className="w-[15px] h-[15px]" />
          </button>
        )}
      </div>
      </aside>
    </>
  );
}
