import { differenceInCalendarDays, parseISO } from "date-fns";
import { Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanPhase } from "@/lib/plan";

const PHASE_LABELS: Record<PlanPhase, { label: string; color: string }> = {
  base: { label: "Base", color: "bg-info" },
  build: { label: "Build", color: "bg-success" },
  specific: { label: "Specific", color: "bg-warning" },
  taper: { label: "Taper", color: "bg-primary" },
};

const PHASE_ORDER: PlanPhase[] = ["base", "build", "specific", "taper"];

export default function RaceHeroCard({
  phase,
  weekIndex,
  goalTime,
}: {
  phase: PlanPhase;
  weekIndex: number;
  goalTime?: string;
}) {
  const raceDate = process.env.NEXT_PUBLIC_RACE_DATE || "2026-09-13";
  const race = parseISO(raceDate);
  const today = new Date();
  const daysLeft = Math.max(0, differenceInCalendarDays(race, today));
  const weeksLeft = Math.max(0, Math.ceil(daysLeft / 7));

  const planStart = parseISO(process.env.NEXT_PUBLIC_PLAN_START_DATE || "2026-02-05");
  const totalDays = Math.max(1, differenceInCalendarDays(race, planStart));
  const elapsed = Math.max(0, differenceInCalendarDays(today, planStart));
  const progressPct = Math.min(100, Math.round((elapsed / totalDays) * 100));

  const currentIdx = PHASE_ORDER.indexOf(phase);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-hover to-primary-hover p-5 text-primary-text shadow-lg">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-white/5" />

      {/* Top row: race info */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-white/70" />
            <span className="text-lg font-bold">Media Maratón</span>
          </div>
          <div className="mt-0.5 text-sm text-white/70">{raceDate}</div>
          {goalTime && (
            <div className="mt-1 text-xs text-white/60">Meta: {goalTime}</div>
          )}
        </div>
        <div className="text-right">
          <div className="text-4xl font-extrabold tracking-tight">{weeksLeft}</div>
          <div className="text-xs font-medium text-white/70">semanas</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-white/70">
          <span>Semana {weekIndex}</span>
          <span>{progressPct}% del plan</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-white/90 transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Phase timeline inline */}
      <div className="mt-4 flex items-center gap-1">
        {PHASE_ORDER.map((p, i) => {
          const isPast = i < currentIdx;
          const isCurrent = i === currentIdx;
          const { label, color } = PHASE_LABELS[p];
          return (
            <div key={p} className="flex-1">
              <div
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  isPast || isCurrent ? "bg-white/80" : "bg-white/20",
                  isCurrent && "ring-1 ring-white ring-offset-1 ring-offset-primary-hover",
                )}
              />
              <div
                className={cn(
                  "mt-1 text-center text-[9px] font-medium",
                  isCurrent ? "text-white font-bold" : isPast ? "text-white/70" : "text-white/40",
                )}
              >
                {label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
