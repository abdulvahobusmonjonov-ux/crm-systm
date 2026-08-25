import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";
export function EmptyState({ icon: Icon = Inbox, title, description, action, className }) {
    return (<div className={cn("bg-white dark:bg-gray-900 rounded-2xl shadow-sm py-16 px-6 text-center", className)} style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-[#5E2CA5]/10 dark:bg-[#5E2CA5]/15 flex items-center justify-center">
        <Icon className="w-6 h-6 text-[#5E2CA5]"/>
      </div>
      <p className="text-gray-700 dark:text-gray-200 font-medium text-sm">{title}</p>
      {description && (<p className="text-[13px] text-gray-400 dark:text-gray-500 mt-1.5 max-w-xs mx-auto">{description}</p>)}
      {action && <div className="mt-5">{action}</div>}
    </div>);
}
