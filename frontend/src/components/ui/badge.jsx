import { cn } from "@/lib/utils";
export function Badge({ className, variant = "default", children, ...props }) {
    const variants = {
        default: "bg-[#5E2CA5]/12 text-[#5E2CA5] dark:bg-[#5E2CA5]/20 dark:text-purple-300",
        success: "bg-emerald-500/12 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
        warning: "bg-amber-500/12 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
        danger: "bg-red-500/12 text-red-700 dark:bg-red-500/20 dark:text-red-300",
        info: "bg-blue-500/12 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
        neutral: "bg-gray-500/12 text-gray-600 dark:bg-white/8 dark:text-gray-300",
    };
    return (<span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", variants[variant], className)} {...props}>
      {children}
    </span>);
}
