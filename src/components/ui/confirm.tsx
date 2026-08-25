"use client";

import { useState, useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal, ModalSecondaryButton } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

type Opts = { title?: string; message?: string; confirmText?: string; danger?: boolean };

export function useConfirm() {
  const [state, setState] = useState<{ open: boolean; opts: Opts; resolve?: (v: boolean) => void }>({ open: false, opts: {} });

  const confirm = useCallback((opts: Opts = {}) => new Promise<boolean>((resolve) => {
    setState({ open: true, opts, resolve });
  }), []);

  const close = (v: boolean) => {
    state.resolve?.(v);
    setState((s) => ({ ...s, open: false }));
  };

  const danger = state.opts.danger !== false;

  const dialog = state.open ? (
    <Modal
      title={state.opts.title || "Tasdiqlaysizmi?"}
      maxWidth="max-w-sm"
      zIndex="z-[60]"
      onClose={() => close(false)}
      footer={
        <>
          <button
            onClick={() => close(true)}
            className={cn(
              "flex-1 py-2.5 text-white text-[13px] font-semibold rounded-xl transition-colors",
              danger ? "bg-red-600 hover:bg-red-700" : "bg-[#5E2CA5] hover:bg-[#4a2280]"
            )}
          >
            {state.opts.confirmText || "O'chirish"}
          </button>
          <ModalSecondaryButton onClick={() => close(false)}>Bekor qilish</ModalSecondaryButton>
        </>
      }
    >
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center mb-1",
        danger ? "bg-red-100 dark:bg-red-900/30" : "bg-[#5E2CA5]/10 dark:bg-[#5E2CA5]/20"
      )}>
        <AlertTriangle className={cn("w-6 h-6", danger ? "text-red-600" : "text-[#5E2CA5]")} />
      </div>
      {state.opts.message && <p className="text-[13px] text-gray-500 dark:text-gray-400">{state.opts.message}</p>}
    </Modal>
  ) : null;

  return { confirm, dialog };
}
