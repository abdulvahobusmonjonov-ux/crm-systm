"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function NotesTab({ groupId, initialNotes }: { groupId: string; initialNotes: string }) {
  const [text, setText] = useState(initialNotes);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const res = await fetch(`/api/teacher/groups/${groupId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: text }),
    });
    setSaving(false);
    if (res.ok) toast.success("Izoh saqlandi");
    else toast.error("Saqlab bo'lmadi");
  };

  return (
    <Card className="p-5 space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        placeholder="Guruh haqida izoh yozing..."
        className="w-full px-3 py-2.5 text-[13px] border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 focus:border-[#5E2CA5]/50 transition resize-y"
      />
      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold bg-[#5E2CA5] hover:bg-[#4a2280] text-white shadow-sm transition-colors disabled:opacity-60"
        >
          <Save className="w-3.5 h-3.5" /> {saving ? "Saqlanmoqda..." : "Saqlash"}
        </button>
      </div>
    </Card>
  );
}
