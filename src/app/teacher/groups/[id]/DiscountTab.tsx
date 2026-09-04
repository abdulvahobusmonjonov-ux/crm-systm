"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface Student { id: string; fullName: string; discountPercent: number; }

export default function DiscountTab({ groupId, students, onSaved }: { groupId: string; students: Student[]; onSaved: () => void }) {
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const valueFor = (s: Student) => edits[s.id] ?? s.discountPercent;

  const save = async () => {
    const records = Object.entries(edits).map(([leadId, discountPercent]) => ({ leadId, discountPercent }));
    if (records.length === 0) { toast.error("Hech narsa o'zgartirilmadi"); return; }
    setSaving(true);
    const res = await fetch(`/api/teacher/groups/${groupId}/discounts`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records }),
    });
    setSaving(false);
    if (res.ok) { toast.success("Chegirmalar saqlandi"); setEdits({}); onSaved(); }
    else toast.error("Saqlab bo'lmadi (faqat admin)");
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving || Object.keys(edits).length === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold bg-[#5E2CA5] hover:bg-[#4a2280] text-white shadow-sm transition-colors disabled:opacity-40"
        >
          <Save className="w-3.5 h-3.5" /> {saving ? "Saqlanmoqda..." : "Saqlash"}
        </button>
      </div>

      <Card className="overflow-hidden">
        {students.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-gray-400">Bu guruhda o&apos;quvchi yo&apos;q</div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-white/5">
            {students.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 bg-[#5E2CA5]">
                  {getInitials(s.fullName)}
                </div>
                <span className="flex-1 min-w-0 text-[13px] font-medium text-gray-900 dark:text-white truncate">{s.fullName}</span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <input
                    type="number" min={0} max={100}
                    value={valueFor(s)}
                    onChange={(e) => setEdits((prev) => ({ ...prev, [s.id]: Math.max(0, Math.min(100, Number(e.target.value) || 0)) }))}
                    className="w-16 px-2 py-1.5 text-[13px] text-right border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 transition"
                  />
                  <span className="text-[13px] text-gray-400">%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
