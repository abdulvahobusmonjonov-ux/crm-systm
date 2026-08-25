import { cn } from "@/lib/utils";
import { forwardRef } from "react";
export const Button = forwardRef(({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => {
    const variants = {
        primary: "bg-[#5E2CA5] hover:bg-[#4a2280] text-white shadow-sm",
        secondary: "bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-white/8 dark:hover:bg-white/15 dark:text-white",
        outline: "border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300",
        ghost: "hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300",
        danger: "bg-red-600 hover:bg-red-700 text-white shadow-sm",
    };
    const sizes = {
        sm: "px-3 py-1.5 text-xs rounded-xl",
        md: "px-4 py-2 text-sm rounded-xl",
        lg: "px-5 py-2.5 text-base rounded-xl",
    };
    return (<button ref={ref} disabled={disabled || loading} className={cn("inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/40 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-60 disabled:cursor-not-allowed", variants[variant], sizes[size], className)} {...props}>
        {loading && (<svg className="animate-spin -ml-0.5 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>)}
        {children}
      </button>);
});
Button.displayName = "Button";
