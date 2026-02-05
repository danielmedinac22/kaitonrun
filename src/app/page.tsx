import { addDays, format, startOfWeek } from "date-fns";
import Link from "next/link";
import { readWorkouts, workoutByDate, type WorkoutType } from "@/lib/workouts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const plannedDow = new Set([2, 4, 0]); // Tue Thu Sun

function dateKey(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function dowShort(d: Date) {
  return format(d, "EEE").toUpperCase();
}

function plannedTypeForDow(dow: number): WorkoutType {
  if (dow === 0 || dow === 2 || dow === 4) return "run";
  return "rest";
}

function plannedLabel(type: WorkoutType) {
  if (type === "run") return "Correr";
  if (type === "gym") return "Fortalecimiento";
  return "Descanso";
}

export default function WeekPage() {
  const base = startOfWeek(new Date(), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }).map((_, i) => addDays(base, i));

  const workouts = readWorkouts();
  const byDate = workoutByDate(workouts);

  const today = new Date();
  const todayKey = dateKey(today);
  const todayLogged = byDate.get(todayKey);
  const todayDow = today.getDay();
  const todayPlannedType = plannedTypeForDow(todayDow);

  const todayBadge = todayLogged
    ? { v: "done" as const, t: "Hecho" }
    : plannedDow.has(todayDow)
      ? { v: "pending" as const, t: "Pendiente" }
      : { v: "default" as const, t: "Libre" };

  return (
    <main className="space-y-4">
      <Card className="border-indigo-100 bg-gradient-to-br from-white to-indigo-50/50">
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>Plan de hoy</CardTitle>
              <Badge variant={todayBadge.v as any}>{todayBadge.t}</Badge>
            </div>
            <CardDescription className="mt-1">
              {format(today, "EEEE d MMM", { locale: undefined })} · {plannedLabel(todayLogged?.type ?? todayPlannedType)}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="secondary">
              <Link href={`/log?date=${todayKey}`}>Registrar</Link>
            </Button>
            <Button asChild>
              <Link href={`/log?date=${todayKey}`}>{todayLogged ? "Editar" : "Marcar"}</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold text-slate-500">Qué hacer</div>
              <div className="mt-1 text-sm text-slate-700">
                {todayLogged ? (
                  <span>
                    Registrado: <span className="font-semibold capitalize">{todayLogged.type}</span>
                    {todayLogged.minutes ? ` · ${todayLogged.minutes} min` : ""}
                    {todayLogged.rpe ? ` · RPE ${todayLogged.rpe}/10` : ""}
                  </span>
                ) : todayPlannedType === "run" ? (
                  <ul className="list-disc pl-5">
                    <li>35–50 min</li>
                    <li>RPE 3–7 según sesión</li>
                    <li>Al final: minutos + RPE + notas</li>
                  </ul>
                ) : (
                  <ul className="list-disc pl-5">
                    <li>Movilidad 10–15 min</li>
                    <li>O fuerza (20–30 min) si te sientes bien</li>
                  </ul>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold text-slate-500">Regla</div>
              <div className="mt-1 text-sm text-slate-700">
                Si aparece dolor que cambia tu zancada: paramos y ajustamos.
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold text-slate-500">Siguiente</div>
              <div className="mt-1 text-sm text-slate-700">
                Mar/Jue/Dom · 2 sesiones cortas + 1 largo.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Semana actual</CardTitle>
          <CardDescription>Mar/Jue/Dom — objetivo media maratón.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {days.map((d) => {
              const key = dateKey(d);
              const w = byDate.get(key);
              const dow = d.getDay();
              const isPlanned = plannedDow.has(dow);

              const badge = w
                ? { v: "done" as const, t: "Hecho" }
                : isPlanned
                  ? { v: "pending" as const, t: "Pendiente" }
                  : { v: "default" as const, t: "Libre" };

              return (
                <div key={key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-slate-500">{dowShort(d)}</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">{format(d, "d MMM")}</div>
                    </div>
                    <Badge variant={badge.v as any}>{badge.t}</Badge>
                  </div>

                  <div className="mt-3 text-sm text-slate-700">
                    {w ? (
                      <div className="space-y-1">
                        <div className="font-medium capitalize">{w.type}</div>
                        <div className="text-slate-500">
                          {w.minutes ? `${w.minutes} min` : ""} {w.rpe ? `· RPE ${w.rpe}/10` : ""}
                        </div>
                      </div>
                    ) : isPlanned ? (
                      <ul className="list-disc space-y-1 pl-5 text-slate-600">
                        <li>30–60 min</li>
                        <li>RPE 3–7 según sesión</li>
                      </ul>
                    ) : (
                      <div className="text-slate-500">Descanso o fuerza.</div>
                    )}
                  </div>

                  <div className="mt-4">
                    <Button asChild variant={w ? "secondary" : "default"}>
                      <Link href={`/log?date=${key}`}>{w ? "Editar" : "Registrar"}</Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
