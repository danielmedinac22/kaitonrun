import { CheckCircle2, Clock, TrendingUp } from "lucide-react";

export default function PlanProgressSummary({
  doneCount,
  plannedCount,
  doneMinutes,
  weekPct,
}: {
  doneCount: number;
  plannedCount: number;
  doneMinutes: number;
  weekPct: number;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-success-soft px-3 py-2.5">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
        <div className="min-w-0">
          <div className="text-xs text-success/70">Sesiones</div>
          <div className="text-sm font-bold text-success">{doneCount}/{plannedCount}</div>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-primary-soft px-3 py-2.5">
        <Clock className="h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0">
          <div className="text-xs text-primary/70">Minutos</div>
          <div className="text-sm font-bold text-primary">{doneMinutes}</div>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-warning-soft px-3 py-2.5">
        <TrendingUp className="h-4 w-4 shrink-0 text-warning" />
        <div className="min-w-0">
          <div className="text-xs text-warning/70">Semana</div>
          <div className="text-sm font-bold text-warning">{weekPct}%</div>
        </div>
      </div>
    </div>
  );
}
