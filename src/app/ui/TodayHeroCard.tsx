import Link from "next/link";
import { format } from "date-fns";
import { Clock, Gauge, Activity, Dumbbell, Sparkles, Check, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanItem, PlanPhase } from "@/lib/plan";
import type { Workout } from "@/lib/workouts";

type TodayHeroCardProps = {
  todayPlan: PlanItem;
  todayLogged: Workout | undefined;
  weekIndex: number;
  phase: PlanPhase;
  weeksToRace: number;
  nextSessionDate: Date | null;
  nextSessionPlan: PlanItem;
  name?: string;
};

export default function TodayHeroCard({
  todayPlan,
  todayLogged,
  weekIndex,
  phase,
  weeksToRace,
  nextSessionDate,
  nextSessionPlan,
  name,
}: TodayHeroCardProps) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const displayName = name || "runner";

  const isRest = todayPlan.type === "rest";
  const isDone = !!todayLogged;

  // Metadata pills (max 3)
  const pills: { icon: React.ReactNode; text: string }[] = [];
  if (!isRest) {
    if (todayPlan.targetMinutes)
      pills.push({
        icon: <Clock className="h-3.5 w-3.5" />,
        text: `${todayPlan.targetMinutes} min`,
      });
    if (todayPlan.rpe)
      pills.push({
        icon: <Gauge className="h-3.5 w-3.5" />,
        text: `RPE ${todayPlan.rpe}`,
      });
    pills.push({
      icon:
        todayPlan.type === "run" ? (
          <Activity className="h-3.5 w-3.5" />
        ) : (
          <Dumbbell className="h-3.5 w-3.5" />
        ),
      text: todayPlan.type === "run" ? "Correr" : "Fuerza",
    });
  }

  // Status message
  let statusMessage: string | null = null;
  if (isDone) {
    statusMessage = "Buen trabajo hoy. Descansa y recupera.";
  } else if (isRest) {
    statusMessage = "Recupera para lo que viene.";
  }

  return (
    <div className="overflow-hidden rounded-card-xl border border-border bg-surface shadow-card">
      {/* Accent bar on training days */}
      {!isRest && (
        <div className={cn("h-1", isDone ? "bg-success" : "bg-primary")} />
      )}

      <div className="space-y-3 p-5 sm:p-6">
        {/* Greeting */}
        <p className="text-sm font-medium text-txt-secondary">
          {greeting}, {displayName}
        </p>

        {/* Title */}
        <h2 className="-mt-1 text-[22px] font-bold leading-tight tracking-tight text-txt-primary sm:text-2xl">
          {todayPlan.title}
        </h2>

        {/* Date + phase context */}
        <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-txt-muted">
          <span className="capitalize">{format(new Date(), "EEEE d MMM")}</span>
          <span className="text-border">|</span>
          <span>Semana {weekIndex}</span>
          <span className="text-border">|</span>
          <span>{phase}</span>
          <span className="text-border">|</span>
          <span>{weeksToRace} sem a carrera</span>
        </p>

        {/* Metadata pills */}
        {pills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {pills.map((pill, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-full bg-surface-elevated px-2.5 py-1 text-xs text-txt-secondary"
              >
                {pill.icon}
                {pill.text}
              </span>
            ))}
            {/* Status badge */}
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                isDone
                  ? "bg-success-soft text-success"
                  : "bg-warning-soft text-warning",
              )}
            >
              {isDone && <Check className="h-3 w-3" />}
              {isDone ? "Hecho" : "Pendiente"}
            </span>
          </div>
        )}

        {/* Status message */}
        {statusMessage && (
          <p className="text-sm text-txt-secondary">{statusMessage}</p>
        )}

        {/* Completed workout summary */}
        {isDone && todayLogged && (
          <div className="space-y-2 rounded-card border border-success/20 bg-success-soft p-3">
            <div className="flex items-center gap-3 text-sm">
              {todayLogged.minutes != null && (
                <span className="inline-flex items-center gap-1 text-txt-primary">
                  <Clock className="h-3.5 w-3.5 text-success" />
                  {todayLogged.minutes} min
                  {todayPlan.targetMinutes != null && (
                    <span className="text-txt-muted">
                      / {todayPlan.targetMinutes}
                    </span>
                  )}
                </span>
              )}
              {todayLogged.rpe != null && (
                <span className="inline-flex items-center gap-1 text-txt-primary">
                  <Gauge className="h-3.5 w-3.5 text-success" />
                  RPE {todayLogged.rpe}/10
                </span>
              )}
              {todayLogged.source === "strava" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#FC4C02]/10 px-2 py-0.5 text-xs font-medium text-[#FC4C02]">
                  <Zap className="h-3 w-3" />
                  Strava
                </span>
              )}
            </div>
            {todayLogged.notes && (
              <p className="line-clamp-2 text-xs text-txt-secondary">
                {todayLogged.notes}
              </p>
            )}
          </div>
        )}

        {/* Coach note */}
        {todayPlan.coachNote && (
          <div className="flex items-start gap-2 text-sm italic text-secondary">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{todayPlan.coachNote}</span>
          </div>
        )}

        {/* Rest day: tomorrow preview */}
        {isRest && nextSessionDate && (
          <p className="text-sm text-txt-secondary">
            Mañana:{" "}
            <span className="font-medium text-txt-primary">
              {nextSessionPlan.title}
            </span>
          </p>
        )}

        {/* CTAs */}
        <div className="flex gap-3 pt-1">
          {isDone ? (
            <Link
              href="/entrenamientos"
              className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-card-lg border border-success/30 text-base font-semibold text-success transition-all hover:bg-success-soft"
            >
              <Check className="h-5 w-5" />
              Ver plan
            </Link>
          ) : isRest ? (
            <Link
              href="/entrenamientos"
              className="flex min-h-[48px] flex-1 items-center justify-center rounded-card-lg border border-border text-base font-semibold text-txt-secondary transition-all hover:border-primary hover:text-primary"
            >
              Ver plan de mañana
            </Link>
          ) : (
            <>
              <Link
                href="/log"
                className="flex min-h-[48px] flex-1 items-center justify-center rounded-card-lg bg-primary text-base font-semibold text-primary-text transition-all hover:bg-primary-hover active:scale-[0.98]"
              >
                {todayPlan.type === "run" ? "Empezar" : "Entrenar"}
              </Link>
              <Link
                href="/entrenamientos"
                className="flex min-h-[48px] items-center justify-center rounded-card-lg border border-border px-5 text-sm font-medium text-txt-secondary transition-all hover:border-primary hover:text-primary"
              >
                Ver detalles
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
