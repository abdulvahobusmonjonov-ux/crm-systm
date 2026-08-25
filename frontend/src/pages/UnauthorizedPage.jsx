import { useRouter } from "@/lib/router";
import { Lock, ArrowLeft } from "lucide-react";
export default function UnauthorizedPage() {
    const router = useRouter();
    return (<div className="min-h-screen flex items-center justify-center p-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-8 text-center">
        <div className="inline-flex w-16 h-16 rounded-2xl bg-[#5E2CA5]/10 dark:bg-[#5E2CA5]/15 items-center justify-center mb-6">
          <Lock className="w-7 h-7 text-[#5E2CA5]"/>
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Ruxsat yo&apos;q</h1>
        <p className="text-[13px] text-gray-400 dark:text-gray-500 mt-2 mb-6">
          Bu sahifani ko&apos;rish uchun sizda yetarli huquq mavjud emas. Agar bu xato deb hisoblasangiz, administratorga murojaat qiling.
        </p>
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] font-semibold bg-[#5E2CA5] hover:bg-[#4a2280] text-white shadow-sm transition-colors">
          <ArrowLeft className="w-4 h-4"/> Orqaga
        </button>
      </div>
    </div>);
}
