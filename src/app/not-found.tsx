import Link from "next/link";
import { SearchX, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div
      className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center p-4"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="text-center max-w-sm">
        <div className="inline-flex w-20 h-20 rounded-full bg-[#5E2CA5]/10 items-center justify-center mb-6">
          <SearchX className="w-9 h-9 text-[#5E2CA5]" />
        </div>
        <p className="text-[13px] font-bold text-[#5E2CA5] tracking-widest mb-2">404</p>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Sahifa topilmadi</h1>
        <p className="text-[13px] text-gray-400 dark:text-gray-500 mt-2 mb-6">
          Siz qidirgan sahifa mavjud emas yoki ko&apos;chirilgan bo&apos;lishi mumkin.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] font-semibold bg-[#5E2CA5] hover:bg-[#4a2280] text-white shadow-sm transition-colors"
        >
          <Home className="w-4 h-4" /> Bosh sahifaga qaytish
        </Link>
      </div>
    </div>
  );
}
