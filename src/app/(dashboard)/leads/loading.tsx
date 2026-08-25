export default function LeadsLoading() {
  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-2">
          <div className="h-7 w-28 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-4 w-20 bg-gray-100 dark:bg-gray-800/60 rounded-lg animate-pulse" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="h-9 w-52 bg-white dark:bg-gray-900 rounded-xl shadow-sm animate-pulse" />
          <div className="h-9 w-24 bg-white dark:bg-gray-900 rounded-xl shadow-sm animate-pulse" />
          <div className="h-9 w-24 bg-white dark:bg-gray-900 rounded-xl shadow-sm animate-pulse" />
          <div className="h-9 w-32 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Stage filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 w-20 bg-white dark:bg-gray-900 rounded-full shadow-sm animate-pulse" />
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="hidden sm:flex items-center gap-4 px-5 py-3 border-b border-gray-100 dark:border-white/5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-3 flex-1 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
        {/* Rows */}
        <div className="divide-y divide-gray-50 dark:divide-white/5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-1/3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                <div className="h-2.5 w-1/4 bg-gray-50 dark:bg-gray-800/60 rounded animate-pulse" />
              </div>
              <div className="hidden sm:block h-3 w-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              <div className="hidden sm:block h-5 w-20 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse" />
              <div className="hidden sm:block h-3 w-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
