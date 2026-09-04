"use client";

import FinanceTab from "./FinanceTab";
import MessagesTab from "./MessagesTab";

export default function TarixTab({ groupId }: { groupId: string }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">To&apos;lovlar tarixi</p>
        <FinanceTab groupId={groupId} />
      </div>
      <div>
        <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Xabarlar tarixi</p>
        <MessagesTab groupId={groupId} />
      </div>
    </div>
  );
}
