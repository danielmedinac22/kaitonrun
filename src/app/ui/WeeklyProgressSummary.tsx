import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

type WeeklyProgressSummaryProps = {
  weekPct: number;
  weekDone: number;
  weekPlanned: number;
  streak: number;
  weekMinutes: number;
};

export default function WeeklyProgressSummary({
  weekPct,
  weekDone,
  weekPlanned,
  streak,
  weekMinutes,
}: WeeklyProgressSummaryProps) {
  const r = 18;
  const circumference = 2 * Math.PI * r;
  const filled = (weekPct / 100) * circumference;
  const isComplete = weekPct >= 100;

  return (
    <div className="flex items-center gap-4 rounded-card-lg border border-border bg-surface p-4 shadow-card">
      {/* Mini progress ring */}
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
        <svg className="-rotate-90 h-12 w-12" viewBox="0 0 44 44">
          <circle
            cx="22"
            cy="22"
            r={r}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="3"
          />
          <circle
            cx="22"
            cy="22"
            r={r}
            fill="none"
            stroke={isComplete ? "var(--color-success)" : "var(--color-primary)"}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference}`}
            className="transition-all duration-700"
          />
        </svg>
        <span className={cn(
          "absolute text-[11px] font-bold",
          isComplete ? "text-success" : "text-primary",
        )}>
          {weekPct}%
        </span>
      </div>

      {/* Metrics */}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-txt-primary">
          <span className="tabular-nums">{weekDone}</span>
          <span className="text-txt-muted">/{weekPlanned}</span> sesiones
        </div>
        <div className="text-xs text-txt-muted">
          <span className="tabular-nums">{weekMinutes}</span> min esta semana
        </div>
      </div>

      {/* Streak badge */}
      {streak > 0 && (
        <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2.5 py-1 text-xs font-medium text-warning">
          <Flame className="h-3.5 w-3.5" />
          {streak}
        </span>
      )}
    </div>
  );
}
