import { addDays, format, startOfWeek } from "date-fns";
import Link from "next/link";
import { Activity, Dumbbell, Moon, Target, Shield, ArrowRight, Zap } from "lucide-react";

import QuickMarkDialog from "@/app/ui/QuickMarkDialog";
import SyncButton from "@/app/ui/SyncButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { planForDate, programMeta } from "@/lib/plan";
import { readWorkouts, workoutByDate } from "@/lib/workouts";
import { autoSyncRuns } from "@/lib/strava";

export const dynamic = "force-dynamic";

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

function typeIcon(type: string) {
  if (type === "run") return <Activity className="h-4 w-4" />;
  if (type === "gym") return <Dumbbell className="h-4 w-4" />;
  return <Moon className="h-4 w-4" />;
}

export default async function WeekPage() {
  // Auto-sync runs from Strava (respects 1-hour cooldown)
  await autoSyncRuns(7);

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

  // Week progress: how many planned sessions are done
  const weekPlanned = days.filter((d) => plannedDow.has(d.getDay())).length;
  const weekDone = days.filter((d) => byDate.has(dateKey(d))).length;
  const weekPct = weekPlanned > 0 ? Math.round((weekDone / weekPlanned) * 100) : 0;

  return (
    <main className="space-y-5">
      {/* TODAY HERO */}
      <Card className="overflow-hidden border-indigo-100 bg-gradient-to-br from-white via-white to-indigo-50/60">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                {typeIcon(todayLogged?.type ?? todayPlan.type)}
              </span>
              <CardTitle className="text-lg">Hoy</CardTitle>
              <Badge variant={todayBadge.v}>{todayBadge.t}</Badge>
            </div>
            <CardDescription className="mt-2">
              {format(today, "EEEE d MMM")} &middot; {todayLogged ? typeLabel(todayLogged.type) : todayPlan.title}
            </CardDescription>
            <div className="mt-1 flex flex-wrap gap-2">
              <Badge variant="planned">Semana {weekIndex}</Badge>
              <Badge variant="default">{phase}</Badge>
              <Badge variant="default">{weeksToRace} sem a carrera</Badge>
            </div>
          </div>

          {/* Week progress ring */}
          <div className="flex items-center gap-4">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
                <circle
                  cx="32" cy="32" r="28"
                  fill="none"
                  stroke="rgb(226, 232, 240)"
                  strokeWidth="4"
                />
                <circle
                  cx="32" cy="32" r="28"
                  fill="none"
                  stroke="rgb(99, 102, 241)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${(weekPct / 100) * 175.9} 175.9`}
                  className="transition-all duration-700"
                />
              </svg>
              <span className="absolute text-sm font-bold text-indigo-600">{weekPct}%</span>
            </div>
            <div className="text-xs text-slate-500">
              <div className="font-semibold text-slate-700">{weekDone}/{weekPlanned}</div>
              sesiones
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
              <Button asChild variant="secondary">
                <Link href={`/log?date=${todayKey}`}>Registrar</Link>
              </Button>
              <QuickMarkDialog
                date={todayKey}
                defaultType={(todayLogged?.type ?? todayPlan.type) as "run" | "gym" | "rest"}
                triggerText={todayLogged ? "Editar rápido" : "Marcar hecho"}
              />
            </div>
            <SyncButton />
          </div>
        </CardContent>
      </Card>

      {/* TODAY DETAILS */}
      <div className="stagger-children grid gap-3 md:grid-cols-3">
        <Card className="border-slate-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Target className="h-3.5 w-3.5" />
              Qué hacer
            </div>
            <div className="mt-2 text-sm text-slate-700">
              {todayLogged ? (
                <div>
                  <div className="flex items-center gap-2 font-medium text-emerald-700">
                    Registrado
                    {todayLogged.source === "strava" && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-600">
                        <Zap className="h-2.5 w-2.5" />
                        Strava
                      </span>
                    )}
                  </div>
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
          </CardContent>
        </Card>

        <Card className="border-slate-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Shield className="h-3.5 w-3.5" />
              Regla
            </div>
            <div className="mt-2 text-sm text-slate-700">
              Si aparece dolor que cambia tu zancada: paramos y ajustamos.
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <ArrowRight className="h-3.5 w-3.5" />
              Siguiente
            </div>
            <div className="mt-2 text-sm text-slate-700">Mar/Jue/Dom · 2 sesiones cortas + 1 largo.</div>
          </CardContent>
        </Card>
      </div>

      {/* WEEK */}
      <Card>
        <CardHeader>
          <CardTitle>Semana actual</CardTitle>
          <CardDescription>
            {format(base, "d MMM")} — {format(addDays(base, 6), "d MMM")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="stagger-children grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {days.map((d) => {
              const key = dateKey(d);
              const w = byDate.get(key);
              const dow = d.getDay();
              const isPlanned = plannedDow.has(dow);
              const plan = planForDate(d);
              const isToday = key === todayKey;

              const badge = w
                ? { v: "done" as const, t: "Hecho" }
                : isPlanned
                  ? { v: "pending" as const, t: "Pendiente" }
                  : { v: "default" as const, t: "Libre" };

              return (
                <div
                  key={key}
                  className={
                    "rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md " +
                    (isToday
                      ? "border-indigo-200 ring-2 ring-indigo-100"
                      : "border-slate-200")
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={
                        "flex h-6 w-6 items-center justify-center rounded-md text-xs " +
                        (isToday
                          ? "bg-indigo-600 font-bold text-white"
                          : "bg-slate-100 font-semibold text-slate-500")
                      }>
                        {dowShort(d).slice(0, 2)}
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{format(d, "d MMM")}</div>
                      </div>
                    </div>
                    <Badge variant={badge.v}>{badge.t}</Badge>
                  </div>

                  <div className="mt-3 text-sm text-slate-700">
                    {w ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-medium capitalize">
                          {typeIcon(w.type)}
                          {typeLabel(w.type)}
                          {w.source === "strava" && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-600">
                              <Zap className="h-2.5 w-2.5" />
                              Strava
                            </span>
                          )}
                        </div>
                        <div className="text-slate-500">
                          {w.minutes ? `${w.minutes} min` : ""} {w.rpe ? `· RPE ${w.rpe}/10` : ""}
                        </div>
                      </div>
                    ) : (
                      <Accordion type="single" collapsible className="-mx-1">
                        <AccordionItem value="plan" className="border-none">
                          <AccordionTrigger className="rounded-md px-1 hover:bg-slate-50">
                            <span className="flex items-center gap-1.5 text-left">
                              {typeIcon(plan.type)}
                              <span className="font-medium text-slate-800">
                                {plan.type === "run" ? plan.title : plan.type === "gym" ? "Fortalecimiento" : "Descanso"}
                              </span>
                              <span className="ml-1 text-slate-400">
                                {plan.targetMinutes ? `${plan.targetMinutes}m` : ""}
                              </span>
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <ul className="list-disc space-y-1 pl-5 text-slate-600">
                              {plan.details.map((line) => (
                                <li key={line}>{line}</li>
                              ))}
                            </ul>
                            {plan.rpe && (
                              <div className="mt-1.5 text-xs text-slate-500">RPE {plan.rpe}</div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}
                  </div>

                  <div className="mt-4">
                    <Button asChild variant={w ? "secondary" : "default"} size="sm" className="w-full">
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
