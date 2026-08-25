export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-7 w-40 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        <div className="h-4 w-56 bg-gray-100 dark:bg-gray-800/60 rounded-lg animate-pulse" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-white dark:bg-gray-900 rounded-2xl shadow-sm animate-pulse" />
        ))}
      </div>

      {/* Main 2-column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-80 bg-white dark:bg-gray-900 rounded-2xl shadow-sm animate-pulse" />
        <div className="h-80 bg-white dark:bg-gray-900 rounded-2xl shadow-sm animate-pulse" />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-56 bg-white dark:bg-gray-900 rounded-2xl shadow-sm animate-pulse" />
        ))}
      </div>

      {/* Activity feed */}
      <div className="h-64 bg-white dark:bg-gray-900 rounded-2xl shadow-sm animate-pulse" />
    </div>
  );
}
