import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
const BRAND = "#5E2CA5";
export default function ReportsChart({ courseStats = [] }) {
    const chartData = (courseStats || [])
        .filter(c => c && c.count > 0)
        .map(c => ({ name: c.course?.name || "Noma'lum", count: c.count }));
    return (<div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-5">
      <h2 className="text-[14px] font-semibold text-gray-900 dark:text-white mb-4">Kurslar bo&apos;yicha lidlar</h2>
      {chartData.length === 0 ? (<div className="flex flex-col items-center justify-center text-center" style={{ height: 240 }}>
          <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M3 3v18h18"/><rect x="7" y="10" width="3" height="7"/><rect x="12" y="6" width="3" height="11"/><rect x="17" y="13" width="3" height="4"/></svg>
          </div>
          <p className="text-[13px] text-gray-400">Hozircha ma&apos;lumot yo&apos;q</p>
        </div>) : (<ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f5" vertical={false}/>
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={{ stroke: "#f1f1f5" }} tickLine={false}/>
          <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false}/>
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #f1f1f5", fontSize: 12 }} cursor={{ fill: BRAND, fillOpacity: 0.06 }}/>
          <Bar dataKey="count" fill={BRAND} radius={[8, 8, 0, 0]} maxBarSize={36}/>
        </BarChart>
      </ResponsiveContainer>)}
    </div>);
}
