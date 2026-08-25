"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
  zIndex?: string;
}

export function Modal({ onClose, title, subtitle, children, footer, maxWidth = "max-w-md", zIndex = "z-50" }: ModalProps) {
  return (
    <div
      className={cn("fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-modal-overlay", zIndex)}
      onClick={onClose}
    >
      <div
        className={cn(
          "bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-modal-content",
          maxWidth
        )}
        style={{ fontFamily: "'Inter', sans-serif" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[17px] font-bold text-gray-900 dark:text-white">{title}</h2>
            {subtitle && <p className="text-[12px] text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {children}

        {footer && <div className="flex gap-2 pt-1">{footer}</div>}
      </div>
    </div>
  );
}

export const modalFieldCls =
  "w-full px-3 py-2 text-[13px] border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 focus:border-[#5E2CA5]/50 transition";

export const modalLabelCls = "block text-[11px] font-medium text-gray-400 dark:text-gray-500 mb-1.5";

export function ModalPrimaryButton({ children, loading, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={cn(
        "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-semibold bg-[#5E2CA5] hover:bg-[#4a2280] text-white shadow-sm transition-colors disabled:opacity-60",
        props.className
      )}
    >
      {loading ? "Saqlanmoqda..." : children}
    </button>
  );
}

export function ModalSecondaryButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "px-4 py-2.5 rounded-xl text-[13px] font-medium border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors",
        props.className
      )}
    >
      {children}
    </button>
  );
}
