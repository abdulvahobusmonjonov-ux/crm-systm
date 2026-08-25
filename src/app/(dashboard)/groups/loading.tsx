export default function GroupsLoading() {
  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-2">
          <div className="h-7 w-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-4 w-24 bg-gray-100 dark:bg-gray-800/60 rounded-lg animate-pulse" />
        </div>
        <div className="h-9 w-36 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
      </div>

      {/* Group cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm h-52 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
