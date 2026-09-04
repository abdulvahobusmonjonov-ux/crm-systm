"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquareText, Send } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface MessageEntry {
  id: string; leadId: string; leadName: string; channel: "sms" | "telegram";
  text: string; sentBy: string; createdAt: string;
}

export default function MessagesTab({ groupId }: { groupId: string }) {
  const [messages, setMessages] = useState<MessageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/teacher/groups/${groupId}/messages`);
      if (!res.ok) { setError(true); setLoading(false); return; }
      setMessages(await res.json());
    } catch {
      setError(true);
    }
    setLoading(false);
  }, [groupId]);

  useEffect(() => { load(); }, [load]);

  return (
    <Card className="overflow-hidden">
      {loading ? (
        <div className="py-16 text-center text-[13px] text-gray-400 animate-pulse">Yuklanmoqda...</div>
      ) : error ? (
        <div className="py-16 text-center text-[13px] text-red-500">Ma&apos;lumotni yuklab bo&apos;lmadi. Sahifani yangilab ko&apos;ring.</div>
      ) : messages.length === 0 ? (
        <div className="py-16 text-center">
          <MessageSquareText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-[13px] text-gray-400">Hali xabar yuborilmagan</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50 dark:divide-white/5">
          {messages.map((m) => (
            <div key={m.id} className="flex items-start gap-3 px-5 py-3.5">
              <div className="mt-0.5 w-8 h-8 rounded-xl bg-[#5E2CA5]/10 flex items-center justify-center flex-shrink-0">
                <Send className="w-3.5 h-3.5 text-[#5E2CA5]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] font-semibold text-gray-900 dark:text-white">{m.leadName}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/8 text-gray-500 dark:text-gray-400 uppercase">
                    {m.channel === "sms" ? "SMS" : "Telegram"}
                  </span>
                </div>
                <p className="text-[13px] text-gray-600 dark:text-gray-300 mt-1">{m.text}</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  {m.sentBy && `${m.sentBy} · `}{formatRelativeTime(m.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
