"use client";

import { useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronRight, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { typeIcon, typeBgColor } from "@/lib/labels";
import { cn } from "@/lib/utils";
import QuickMarkDialog from "@/app/ui/QuickMarkDialog";
import type { PlanItem } from "@/lib/plan";
import type { Workout } from "@/lib/workouts";

export type SessionDay = {
  date: string;
  plan: PlanItem;
  workout?: Workout;
  isToday: boolean;
};

export default function UpcomingSessionsList({ sessions }: { sessions: SessionDay[] }) {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  if (sessions.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 text-center text-sm text-txt-muted">
        No hay sesiones próximas.
      </div>
    );
  }

  function toggle(date: string) {
    setExpandedDate((prev) => (prev === date ? null : date));
  }

  return (
    <div className="space-y-1.5">
      <h3 className="text-sm font-semibold text-txt-primary">Próximas sesiones</h3>
      <div className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
        {sessions.map((s) => {
          const d = parseISO(s.date);
          const isDone = !!s.workout;
          const type = s.workout?.type ?? s.plan.type;
          const isExpanded = expandedDate === s.date;

          return (
            <div key={s.date}>
              {/* Row header — clickable */}
              <button
                type="button"
                onClick={() => toggle(s.date)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                  s.isToday && "bg-primary-soft/50",
                  isExpanded && !s.isToday && "bg-surface-elevated/50",
                )}
              >
                {/* Type icon */}
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", typeBgColor(type))}>
                  {typeIcon(type, "h-4 w-4")}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-sm font-medium", s.isToday ? "text-primary" : "text-txt-primary")}>
                      {s.isToday ? "Hoy" : format(d, "EEE d MMM", { locale: es })}
                    </span>
                    <Badge variant={isDone ? "done" : "pending"} className="text-[10px]">
                      {isDone ? "Hecho" : "Pendiente"}
                    </Badge>
                  </div>
                  <div className="mt-0.5 text-xs text-txt-secondary truncate">
                    {s.plan.title}
                    {s.plan.targetMinutes ? ` · ${s.plan.targetMinutes} min` : ""}
                    {s.plan.rpe ? ` · RPE ${s.plan.rpe}` : ""}
                  </div>
                </div>

                {/* Chevron */}
                <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all",
                  isDone ? "bg-success-soft text-success" : "bg-primary-soft text-primary",
                )}>
                  {isDone && !isExpanded ? (
                    <span className="text-xs font-bold">&#10003;</span>
                  ) : (
                    <ChevronRight className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      isExpanded && "rotate-90",
                    )} />
                  )}
                </div>
              </button>

              {/* Expanded panel */}
              {isExpanded && (
                <div className={cn(
                  "animate-fade-in px-4 pb-4 pt-1",
                  s.isToday ? "bg-primary-soft/50" : "bg-surface-elevated/50",
                )}>
                  {isDone && s.workout ? (
                    /* Done: show workout summary */
                    <div className="space-y-2 pl-12">
                      <div className="flex items-center gap-2 text-sm font-medium text-success">
                        Registrado
                        {s.workout.source === "strava" && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-primary-soft px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                            <Zap className="h-2.5 w-2.5" />
                            Strava
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-txt-secondary">
                        {s.workout.minutes ? `${s.workout.minutes} min` : ""}
                        {s.workout.rpe ? ` · RPE ${s.workout.rpe}/10` : ""}
                        {s.workout.notes ? ` · ${s.workout.notes}` : ""}
                      </div>
                    </div>
                  ) : (
                    /* Pending: show plan details + CTAs */
                    <div className="space-y-3 pl-12">
                      {s.plan.details.length > 0 && (
                        <ul className="list-disc space-y-0.5 pl-5 text-xs text-txt-secondary">
                          {s.plan.details.map((d) => (
                            <li key={d}>{d}</li>
                          ))}
                        </ul>
                      )}
                      <div className="text-[11px] text-txt-muted">
                        {s.plan.targetMinutes ? `${s.plan.targetMinutes} min` : ""}
                        {s.plan.rpe ? ` · RPE ${s.plan.rpe}` : ""}
                      </div>
                      {s.plan.coachNote && (
                        <div className="rounded-md bg-secondary-soft px-2 py-1 text-xs text-secondary">
                          Coach: {s.plan.coachNote}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <QuickMarkDialog
                            date={s.date}
                            defaultType={s.plan.type as "run" | "gym" | "rest"}
                            triggerText="Marcar hecho"
                          />
                        </div>
                        <Button asChild variant="secondary" size="sm" className="flex-1">
                          <Link href={`/log?date=${s.date}`}>Registrar</Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
