import Link from "next/link";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { typeIcon, typeBgColor } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { PlanItem } from "@/lib/plan";
import type { Workout } from "@/lib/workouts";

export type SessionDay = {
  date: string;
  plan: PlanItem;
  workout?: Workout;
  isToday: boolean;
};

export default function UpcomingSessionsList({ sessions }: { sessions: SessionDay[] }) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 text-center text-sm text-txt-muted">
        No hay sesiones próximas.
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <h3 className="text-sm font-semibold text-txt-primary">Próximas sesiones</h3>
      <div className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
        {sessions.map((s) => {
          const d = parseISO(s.date);
          const isDone = !!s.workout;
          const type = s.workout?.type ?? s.plan.type;

          return (
            <div
              key={s.date}
              className={cn(
                "flex items-center gap-3 px-4 py-3 transition-colors",
                s.isToday && "bg-primary-soft/50",
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
                {s.plan.coachNote && (
                  <div className="mt-1 text-[10px] text-secondary truncate">
                    Coach: {s.plan.coachNote}
                  </div>
                )}
              </div>

              {/* Action */}
              {!isDone ? (
                <Link
                  href={`/log?date=${s.date}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary transition-colors hover:bg-primary-soft/80"
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success-soft text-success">
                  <span className="text-xs font-bold">&#10003;</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
