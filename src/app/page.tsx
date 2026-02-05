import { addDays, format, startOfWeek } from "date-fns";
import Link from "next/link";

import QuickMarkDialog from "@/app/ui/QuickMarkDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { planForDate, programMeta } from "@/lib/plan";
import { readWorkouts, workoutByDate } from "@/lib/workouts";

const plannedDow = new Set([2, 4, 0]); // Tue Thu Sun

function dateKey(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function dowShort(d: Date) {
  return format(d, "EEE").toUpperCase();
}

function typeLabel(type: string) {
  if (type === "run") return "Correr";
  if (type === "gym") return "Fortalecimiento";
  return "Descanso";
}

export default async function WeekPage() {
  const base = startOfWeek(new Date(), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }).map((_, i) => addDays(base, i));

  const workouts = await readWorkouts();
  const byDate = workoutByDate(workouts);

  const today = new Date();
  const todayKey = dateKey(today);
  const todayLogged = byDate.get(todayKey);
  const todayDow = today.getDay();
  const todayPlan = planForDate(today);
  const { weekIndex, phase, weeksToRace } = programMeta(today);

  const todayBadge = todayLogged
    ? { v: "done" as const, t: "Hecho" }
    : plannedDow.has(todayDow)
      ? { v: "pending" as const, t: "Pendiente" }
      : { v: "default" as const, t: "Libre" };

  return (
    <main className="space-y-4">
      {/* TODAY */}
      <Card className="border-indigo-100 bg-gradient-to-br from-white to-indigo-50/50">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>Plan de hoy</CardTitle>
              <Badge variant={todayBadge.v as any}>{todayBadge.t}</Badge>
            </div>
            <CardDescription className="mt-1">
              {format(today, "EEEE d MMM")} · {todayLogged ? typeLabel(todayLogged.type) : todayPlan.title} · Semana {weekIndex} · {phase} · {weeksToRace} sem a carrera
            </CardDescription>
          </div>

          <div className="grid grid-cols-2 gap-2 md:flex md:justify-end">
            <Button asChild variant="secondary" className="w-full">
              <Link href={`/log?date=${todayKey}`}>Registrar</Link>
            </Button>
            <QuickMarkDialog
              date={todayKey}
              defaultType={(todayLogged?.type as any) ?? todayPlan.type}
              triggerText={todayLogged ? "Editar rápido" : "Marcar como hecho"}
            />
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold text-slate-500">Qué hacer</div>
              <div className="mt-2 text-sm text-slate-700">
                {todayLogged ? (
                  <div>
                    <div className="font-medium">Registrado</div>
                    <div className="mt-1 text-slate-500">
                      {typeLabel(todayLogged.type)}
                      {todayLogged.minutes ? ` · ${todayLogged.minutes} min` : ""}
                      {todayLogged.rpe ? ` · RPE ${todayLogged.rpe}/10` : ""}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="font-medium text-slate-800">{todayPlan.title}</div>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
                      {todayPlan.details.map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                    <div className="mt-2 text-xs text-slate-500">
                      {todayPlan.targetMinutes ? `${todayPlan.targetMinutes} min` : ""}
                      {todayPlan.rpe ? ` · RPE ${todayPlan.rpe}` : ""}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold text-slate-500">Regla</div>
              <div className="mt-2 text-sm text-slate-700">
                Si aparece dolor que cambia tu zancada: paramos y ajustamos.
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold text-slate-500">Siguiente</div>
              <div className="mt-2 text-sm text-slate-700">Mar/Jue/Dom · 2 sesiones cortas + 1 largo.</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WEEK */}
      <Card>
        <CardHeader>
          <CardTitle>Semana actual</CardTitle>
          <CardDescription>Mar/Jue/Dom — objetivo media maratón.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {days.map((d) => {
              const key = dateKey(d);
              const w = byDate.get(key);
              const dow = d.getDay();
              const isPlanned = plannedDow.has(dow);
              const plan = planForDate(d);

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
                    ) : (
                      <Accordion type="single" collapsible className="-mx-1">
                        <AccordionItem value="plan" className="border-none">
                          <AccordionTrigger className="rounded-md px-1 hover:bg-slate-50">
                            <span className="text-left">
                              <span className="font-medium text-slate-800">
                                {plan.type === "run" ? plan.title : plan.type === "gym" ? "Fortalecimiento" : "Descanso"}
                              </span>
                              <span className="ml-2 text-slate-500">
                                {plan.targetMinutes ? `${plan.targetMinutes} min` : ""}
                                {plan.rpe ? ` · RPE ${plan.rpe}` : ""}
                              </span>
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <ul className="list-disc space-y-1 pl-5 text-slate-600">
                              {plan.details.map((line) => (
                                <li key={line}>{line}</li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
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
