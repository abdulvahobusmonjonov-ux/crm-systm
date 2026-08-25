export default function PaymentsLoading() {
  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-2">
          <div className="h-7 w-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-4 w-48 bg-gray-100 dark:bg-gray-800/60 rounded-lg animate-pulse" />
        </div>
        <div className="h-9 w-44 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-5 flex items-start gap-4 animate-pulse">
            <div className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-gray-800 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-20 bg-gray-100 dark:bg-gray-800 rounded" />
              <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="h-10 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-sm animate-pulse" />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="h-9 flex-1 min-w-[200px] bg-white dark:bg-gray-900 rounded-xl shadow-sm animate-pulse" />
        <div className="h-9 w-36 bg-white dark:bg-gray-900 rounded-xl shadow-sm animate-pulse" />
      </div>

      {/* Table card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
        <div className="hidden sm:flex items-center gap-4 px-5 py-3 border-b border-gray-100 dark:border-white/5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-3 flex-1 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
        <div className="divide-y divide-gray-50 dark:divide-white/5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-1/3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                <div className="h-2.5 w-1/5 bg-gray-50 dark:bg-gray-800/60 rounded animate-pulse" />
              </div>
              <div className="hidden sm:block h-3 w-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              <div className="hidden sm:block h-3 w-14 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              <div className="hidden sm:block h-5 w-16 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
