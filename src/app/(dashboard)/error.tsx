"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home } from "lucide-react";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div
      className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center p-4"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="text-center max-w-sm">
        <div className="inline-flex w-20 h-20 rounded-full bg-red-500/10 items-center justify-center mb-6">
          <AlertTriangle className="w-9 h-9 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Nimadir noto&apos;g&apos;ri ketdi</h1>
        <p className="text-[13px] text-gray-400 dark:text-gray-500 mt-2 mb-6">
          Kutilmagan xatolik yuz berdi. Sahifani qayta yuklang yoki bosh sahifaga qaytib urinib ko&apos;ring.
        </p>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-xl text-[13px] font-medium border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            Qayta urinish
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] font-semibold bg-[#5E2CA5] hover:bg-[#4a2280] text-white shadow-sm transition-colors"
          >
            <Home className="w-4 h-4" /> Bosh sahifaga qaytish
          </Link>
        </div>
      </div>
    </div>
  );
}
