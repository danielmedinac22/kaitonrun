import { cn } from "@/lib/utils";
import type { PlanPhase } from "@/lib/plan";

const PHASE_COLORS: Record<PlanPhase, string> = {
  base: "bg-info-soft text-info",
  build: "bg-success-soft text-success",
  specific: "bg-warning-soft text-warning",
  taper: "bg-primary-soft text-primary",
};

function rpeColor(rpe: number | null): string {
  if (rpe === null) return "text-txt-muted";
  if (rpe >= 8) return "text-danger";
  if (rpe >= 6) return "text-warning";
  return "text-success";
}

export default function CoachContextHeader({
  phase,
  weeksToRace,
  weekIndex,
  avgRpe,
  completionPct,
}: {
  phase: PlanPhase;
  weeksToRace: number;
  weekIndex: number;
  avgRpe: number | null;
  completionPct: number;
}) {
  return (
    <div className="rounded-xl border border-secondary/20 bg-gradient-to-r from-secondary-soft to-surface p-4">
      {/* Row 1: Phase + Week */}
      <div className="flex items-center gap-2">
        <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold capitalize", PHASE_COLORS[phase])}>
          {phase}
        </span>
        <span className="text-sm font-semibold text-txt-primary">Semana {weekIndex}</span>
      </div>

      {/* Row 2: Metrics */}
      <div className="mt-2.5 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium text-txt-muted uppercase">RPE</span>
          <span className={cn("text-sm font-bold", rpeColor(avgRpe))}>
            {avgRpe !== null ? avgRpe : "—"}
          </span>
        </div>

        <div className="h-4 w-px bg-border" />

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium text-txt-muted uppercase">Cumplimiento</span>
          <span className="text-sm font-bold text-primary">{completionPct}%</span>
        </div>

        <div className="h-4 w-px bg-border" />

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium text-txt-muted uppercase">Carrera</span>
          <span className="text-sm font-bold text-txt-primary">{weeksToRace} sem</span>
        </div>
      </div>
    </div>
  );
}
