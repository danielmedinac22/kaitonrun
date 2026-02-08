import { Trophy } from "lucide-react";
import type { PersonalRecord } from "@/lib/stats";

export default function PersonalRecords({ records }: { records: PersonalRecord[] }) {
  if (records.length === 0) return null;

  return (
    <div className="rounded-xl border border-warning/20 bg-surface p-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-warning mb-3">
        <Trophy className="h-4 w-4" />
        Rcords personales
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {records.map((r) => (
          <div key={r.label} className="rounded-lg bg-warning-soft p-3">
            <div className="text-[10px] font-medium text-warning">{r.label}</div>
            <div className="mt-0.5 text-lg font-bold text-txt-primary">{r.value}</div>
            {r.date && <div className="text-[10px] text-txt-muted">{r.date}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
