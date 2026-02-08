import Link from "next/link";
import { format } from "date-fns";
import { Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import QuickMarkDialog from "@/app/ui/QuickMarkDialog";
import { typeLabel, typeIcon, typeBgColor } from "@/lib/labels";
import type { PlanItem } from "@/lib/plan";
import type { Workout } from "@/lib/workouts";

export default function TodaySessionCard({
  todayKey,
  todayLogged,
  todayPlan,
  todayBadge,
}: {
  todayKey: string;
  todayLogged: Workout | undefined;
  todayPlan: PlanItem;
  todayBadge: { v: "done" | "pending" | "default"; t: string };
}) {
  const today = new Date();

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-surface via-surface to-primary-soft/60">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${typeBgColor(todayLogged?.type ?? todayPlan.type)}`}>
            {typeIcon(todayLogged?.type ?? todayPlan.type, "h-5 w-5")}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-txt-primary">Hoy</span>
              <Badge variant={todayBadge.v}>{todayBadge.t}</Badge>
            </div>
            <div className="mt-0.5 text-xs text-txt-secondary">
              {format(today, "EEEE d MMM")} &middot; {todayLogged ? typeLabel(todayLogged.type) : todayPlan.title}
            </div>

            {todayLogged ? (
              <div className="mt-2 text-sm text-txt-primary">
                <div className="flex items-center gap-2 font-medium text-success">
                  Registrado
                  {todayLogged.source === "strava" && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-primary-soft px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                      <Zap className="h-2.5 w-2.5" />
                      Strava
                    </span>
                  )}
                </div>
                <div className="mt-1 text-xs text-txt-secondary">
                  {typeLabel(todayLogged.type)}
                  {todayLogged.minutes ? ` · ${todayLogged.minutes} min` : ""}
                  {todayLogged.rpe ? ` · RPE ${todayLogged.rpe}/10` : ""}
                </div>
              </div>
            ) : (
              <div className="mt-2">
                <ul className="list-disc space-y-0.5 pl-5 text-xs text-txt-secondary">
                  {todayPlan.details.slice(0, 3).map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
                <div className="mt-1 text-[11px] text-txt-muted">
                  {todayPlan.targetMinutes ? `${todayPlan.targetMinutes} min` : ""}
                  {todayPlan.rpe ? ` · RPE ${todayPlan.rpe}` : ""}
                </div>
                {todayPlan.coachNote && (
                  <div className="mt-2 rounded-md bg-secondary-soft px-2 py-1 text-xs text-secondary">
                    Coach: {todayPlan.coachNote}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <Button asChild variant="secondary" size="sm" className="flex-1">
            <Link href={`/log?date=${todayKey}`}>Registrar</Link>
          </Button>
          <div className="flex-1">
            <QuickMarkDialog
              date={todayKey}
              defaultType={(todayLogged?.type ?? todayPlan.type) as "run" | "gym" | "rest"}
              triggerText={todayLogged ? "Editar rpido" : "Marcar hecho"}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
