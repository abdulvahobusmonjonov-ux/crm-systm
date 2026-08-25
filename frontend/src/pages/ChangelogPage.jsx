import { Sparkles, Wrench, Zap, Bug } from "lucide-react";
import { cn, formatDateUz } from "@/lib/utils";
const BRAND = "#5E2CA5";
const TYPE_META = {
    new: { label: "Yangi", icon: Sparkles, cls: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
    improved: { label: "Yaxshilandi", icon: Zap, cls: "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400" },
    fixed: { label: "Tuzatildi", icon: Bug, cls: "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400" },
};
const CHANGELOG = [
    {
        version: "v3.4.0",
        date: "2026-07-09",
        title: "Yangilanishlar tarixi",
        changes: [
            { type: "new", text: "\"Yangilanishlar tarixi\" sahifasi qo'shildi" },
            { type: "improved", text: "Header'da yangi versiya haqida bildirishnoma" },
        ],
    },
    {
        version: "v3.3.0",
        date: "2026-06-18",
        title: "Xodimlar davomati",
        changes: [
            { type: "new", text: "Xodimlar davomati (staff-attendance) moduli" },
            { type: "new", text: "Kirish/chiqish vaqtlari va kechikish statistikasi" },
            { type: "improved", text: "O'qituvchi hisoboti sahifasi tezlashtirildi" },
        ],
    },
    {
        version: "v3.2.0",
        date: "2026-05-22",
        title: "Moliya moduli",
        changes: [
            { type: "new", text: "Pul oqimi (cashflow) va chek generatsiyasi" },
            { type: "new", text: "Imtihon uchun tanga (gamifikatsiya) tizimi" },
            { type: "improved", text: "Bayram/arxiv filtrlari va SMS integratsiyasi" },
        ],
    },
    {
        version: "v3.1.0",
        date: "2026-04-10",
        title: "Kanban va lidlar",
        changes: [
            { type: "new", text: "Lidlar uchun Kanban board (drag & drop)" },
            { type: "improved", text: "Kanban ustunlarini yig'ish (collapse) imkoniyati" },
            { type: "fixed", text: "Lidni o'chirishda tasdiqlash oynasi qo'shildi" },
        ],
    },
    {
        version: "v3.0.0",
        date: "2026-03-02",
        title: "Zamonaviy dizayn",
        changes: [
            { type: "new", text: "Butun tizim uchun zamonaviy interfeys dizayni" },
            { type: "new", text: "Dark mode (qorong'i rejim) qo'llab-quvvatlash" },
            { type: "improved", text: "Barcha sahifalarda tezkor ishlash va responsivlik" },
        ],
    },
    {
        version: "v2.0.0",
        date: "2026-01-15",
        title: "Robocode CRM",
        changes: [
            { type: "new", text: "To'lovlar, davomat va profil sahifalari" },
            { type: "new", text: "O'qituvchilar uchun dars jadvali va analitika" },
        ],
    },
];
export default function ChangelogPage() {
    return (<div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Yangilanishlar tarixi</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Tizimga qo&apos;shilgan versiyalar va o&apos;zgarishlar</p>
      </div>

      {/* Timeline */}
      <div className="max-w-2xl">
        <ol className="relative">
          {CHANGELOG.map((entry, idx) => {
            const isLast = idx === CHANGELOG.length - 1;
            return (<li key={entry.version} className="relative pl-10 pb-6 last:pb-0">
                {/* Vertical line */}
                {!isLast && (<span className="absolute left-[13px] top-7 bottom-0 w-px bg-gray-200 dark:bg-white/10" aria-hidden/>)}
                {/* Dot */}
                <span className="absolute left-0 top-1 w-7 h-7 rounded-full flex items-center justify-center ring-4 ring-[#F5F6FA] dark:ring-gray-950" style={{ backgroundColor: idx === 0 ? BRAND : "#E5E7EB" }}>
                  <span className={cn("w-2.5 h-2.5 rounded-full", idx === 0 ? "bg-white" : "bg-gray-400 dark:bg-gray-600")}/>
                </span>

                {/* Card */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-4 sm:p-5">
                  <div className="flex items-center flex-wrap gap-2 mb-2">
                    <span className="inline-flex items-center text-[12px] font-bold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: BRAND }}>
                      {entry.version}
                    </span>
                    <span className="text-[13px] font-semibold text-gray-900 dark:text-white">
                      {entry.title}
                    </span>
                    <span className="ml-auto text-[12px] text-gray-400 dark:text-gray-500 tabular-nums">
                      {formatDateUz(entry.date)}
                    </span>
                  </div>

                  <ul className="space-y-1.5 mt-3">
                    {entry.changes.map((change, i) => {
                    const meta = TYPE_META[change.type];
                    const Icon = meta.icon;
                    return (<li key={i} className="flex items-start gap-2">
                          <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 mt-0.5", meta.cls)}>
                            <Icon className="w-3 h-3"/>
                            {meta.label}
                          </span>
                          <span className="text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed">
                            {change.text}
                          </span>
                        </li>);
                })}
                  </ul>
                </div>
              </li>);
        })}
        </ol>

        {/* End marker */}
        <div className="flex items-center gap-2 pl-10 -mt-2 text-[12px] text-gray-400 dark:text-gray-500">
          <Wrench className="w-3.5 h-3.5"/>
          Bu tizimning boshlang&apos;ich versiyasi
        </div>
      </div>
    </div>);
}
