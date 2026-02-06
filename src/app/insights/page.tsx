import { format, parseISO, startOfWeek, subWeeks } from "date-fns";

import Link from "next/link";
import { Activity, Dumbbell, CheckCircle2, Clock, Flame, TrendingUp, Download } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { readWorkouts } from "@/lib/workouts";
import { planForDate } from "@/lib/plan";
import CoachChat from "@/app/ui/CoachChat";

function dateKey(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function pct(n: number, d: number) {
  if (d <= 0) return 0;
  return Math.round((n / d) * 100);
}

function typeLabel(type: string) {
  if (type === "run") return "Correr";
  if (type === "gym") return "Fortalecimiento";
  return "Descanso";
}

function barColor(minutes: number, max: number) {
  const ratio = max > 0 ? minutes / max : 0;
  if (ratio >= 0.7) return "bg-indigo-500";
  if (ratio >= 0.4) return "bg-emerald-500";
  return "bg-amber-400";
}

export const dynamic = "force-dynamic";

export default async function InsightsPage({
  searchParams,
}: {
  searchParams?: { from?: string; to?: string };
}) {
  const workouts = await readWorkouts();

  const today = new Date();

  const fromParam = searchParams?.from ? parseISO(searchParams.from) : null;
  const toParam = searchParams?.to ? parseISO(searchParams.to) : null;

  const start = fromParam && !Number.isNaN(fromParam.getTime()) ? fromParam : startOfWeek(today, { weekStartsOn: 1 });
  const end = toParam && !Number.isNaN(toParam.getTime()) ? toParam : (() => {
    const d = new Date(start);
    d.setDate(d.getDate() + 7);
    return d;
  })();

  const daysInRange = Math.max(1, Math.min(31, Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))));
  const plannedDays = Array.from({ length: daysInRange }).map((_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });

  const plannedSessions = plannedDays
    .map((d) => planForDate(d))
    .filter((p) => p.type !== "rest");

  const plannedCount = plannedSessions.length;
  const plannedMinutes = plannedSessions.reduce((acc, p) => acc + (p.targetMinutes ?? 0), 0);

  const plannedRuns = plannedDays.map((d) => planForDate(d)).filter((p) => p.type === "run");
  const plannedGym = plannedDays.map((d) => planForDate(d)).filter((p) => p.type === "gym");
  const plannedRunMinutes = plannedRuns.reduce((acc, p) => acc + (p.targetMinutes ?? 0), 0);
  const plannedGymMinutes = plannedGym.reduce((acc, p) => acc + (p.targetMinutes ?? 0), 0);

  const workoutsThisWeek = workouts.filter((w) => {
    const d = parseISO(w.date);
    return d >= start && d < end;
  });

  const plannedByDate = new Map<string, ReturnType<typeof planForDate>>(
    plannedDays.map((d) => [dateKey(d), planForDate(d)])
  );

  const changedCount = workoutsThisWeek.filter((w) => {
    const planned = plannedByDate.get(w.date);
    if (!planned) return false;
    if (planned.type === "rest") return false;
    return w.type !== planned.type;
  }).length;

  const doneCount = workoutsThisWeek.filter((w) => w.type !== "rest").length;
  const doneMinutes = workoutsThisWeek.reduce((acc, w) => acc + (w.minutes ?? 0), 0);

  const doneRuns = workoutsThisWeek.filter((w) => w.type === "run");
  const doneGym = workoutsThisWeek.filter((w) => w.type === "gym");
  const doneRunMinutes = doneRuns.reduce((acc, w) => acc + (w.minutes ?? 0), 0);
  const doneGymMinutes = doneGym.reduce((acc, w) => acc + (w.minutes ?? 0), 0);

  const rpes = workoutsThisWeek
    .map((w) => (typeof w.rpe === "number" ? w.rpe : Number(w.rpe)))
    .filter((n) => Number.isFinite(n));

  const avgRpe = rpes.length ? Math.round((rpes.reduce((a, b) => a + b, 0) / rpes.length) * 10) / 10 : null;

  const byDate = new Set(workouts.map((w) => w.date));
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (byDate.has(dateKey(d))) streak++;
    else break;
  }

  const trendWeeks = Array.from({ length: 8 }).map((_, i) => {
    const wkStart = startOfWeek(subWeeks(today, 7 - i), { weekStartsOn: 1 });
    const wkEnd = new Date(wkStart);
    wkEnd.setDate(wkEnd.getDate() + 7);

    const wks = workouts.filter((w) => {
      const d = parseISO(w.date);
      return d >= wkStart && d < wkEnd;
    });

    const minutes = wks.reduce((acc, w) => acc + (w.minutes ?? 0), 0);
    return { wkStart, minutes };
  });

  const maxMinutes = Math.max(1, ...trendWeeks.map((t) => t.minutes));

  const completionPct = pct(doneCount, plannedCount);

  return (
    <main className="space-y-5">
      {/* Header + Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>Progreso</CardTitle>
              <CardDescription>Resumen y tendencia de entrenamiento.</CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Button asChild size="sm" variant="secondary">
                  <Link href="/insights">Semana</Link>
                </Button>
                <Button asChild size="sm" variant="secondary">
                  <Link
                    href={(() => {
                      const d = new Date();
                      const from = new Date(d);
                      from.setDate(d.getDate() - 30);
                      const f = format(from, "yyyy-MM-dd");
                      const t = format(d, "yyyy-MM-dd");
                      return `/insights?from=${encodeURIComponent(f)}&to=${encodeURIComponent(t)}`;
                    })()}
                  >
                    30d
                  </Link>
                </Button>
                <Button asChild size="sm" variant="secondary">
                  <Link
                    href={(() => {
                      const d = new Date();
                      const from = new Date(d);
                      from.setDate(d.getDate() - 90);
                      const f = format(from, "yyyy-MM-dd");
                      const t = format(d, "yyyy-MM-dd");
                      return `/insights?from=${encodeURIComponent(f)}&to=${encodeURIComponent(t)}`;
                    })()}
                  >
                    90d
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <form action="/insights" className="flex flex-wrap items-end gap-2">
              <label className="grid gap-1 text-xs font-medium text-slate-600">
                Desde
                <input
                  name="from"
                  defaultValue={searchParams?.from || ""}
                  type="date"
                  className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 transition-colors"
                />
              </label>
              <label className="grid gap-1 text-xs font-medium text-slate-600">
                Hasta
                <input
                  name="to"
                  defaultValue={searchParams?.to || ""}
                  type="date"
                  className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 transition-colors"
                />
              </label>
              <Button type="submit" size="sm" variant="secondary">
                Ver
              </Button>
            </form>
            <Button asChild size="sm" variant="secondary">
              <Link
                href={
                  `/api/export?format=csv` +
                  (searchParams?.from ? `&from=${encodeURIComponent(searchParams.from)}` : "") +
                  (searchParams?.to ? `&to=${encodeURIComponent(searchParams.to)}` : "")
                }
              >
                <Download className="h-3.5 w-3.5" />
                CSV
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="stagger-children grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <div className="text-xs font-medium text-slate-500">Cumplimiento</div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <div className="text-3xl font-bold text-slate-900">{completionPct}%</div>
              <div className="text-sm text-slate-500">{doneCount}/{plannedCount}</div>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="animate-progress h-full rounded-full bg-indigo-500"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <Clock className="h-4 w-4" />
              </span>
              <div className="text-xs font-medium text-slate-500">Minutos</div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <div className="text-3xl font-bold text-slate-900">{doneMinutes}</div>
              <div className="text-sm text-slate-500">/ {plannedMinutes} min</div>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="animate-progress h-full rounded-full bg-emerald-500"
                style={{ width: `${Math.min(100, pct(doneMinutes, plannedMinutes))}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                <TrendingUp className="h-4 w-4" />
              </span>
              <div className="text-xs font-medium text-slate-500">RPE promedio</div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-bold text-slate-900">{avgRpe ?? "—"}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                <Flame className="h-4 w-4" />
              </span>
              <div className="text-xs font-medium text-slate-500">Racha</div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <div className="text-3xl font-bold text-slate-900">{streak}</div>
              <div className="text-sm text-slate-500">días</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas 8 semanas</CardTitle>
          <CardDescription>Minutos registrados por semana.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {trendWeeks.map((t, i) => {
              const w = Math.round((clamp(t.minutes, 0, maxMinutes) / maxMinutes) * 100);
              const isLast = i === trendWeeks.length - 1;
              return (
                <div key={t.wkStart.toISOString()} className="flex items-center gap-3">
                  <div className={`w-20 text-xs font-semibold ${isLast ? "text-indigo-600" : "text-slate-500"}`}>
                    {format(t.wkStart, "dd MMM")}
                  </div>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`animate-progress h-full rounded-full transition-all ${barColor(t.minutes, maxMinutes)}`}
                      style={{ width: `${w}%`, animationDelay: `${i * 100}ms` }}
                    />
                  </div>
                  <div className={`w-16 text-right text-xs font-medium ${isLast ? "text-indigo-600" : "text-slate-500"}`}>
                    {t.minutes}m
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* AI COACH */}
      <CoachChat />

      {/* Weekly breakdown */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Detalle semanal</CardTitle>
              <CardDescription>
                {format(start, "dd MMM")} — {format(end, "dd MMM")}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="planned">Planned</Badge>
              <Badge variant="done">Hecho</Badge>
              <Badge variant="pending">Pendiente</Badge>
              {changedCount > 0 && <Badge variant="changed">{changedCount} cambiados</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 md:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
              <Activity className="h-5 w-5 text-indigo-500" />
              <div>
                <div className="text-xs font-medium text-slate-500">Minutos Run</div>
                <div className="font-semibold text-slate-900">
                  {doneRunMinutes} <span className="text-sm font-normal text-slate-500">/ {plannedRunMinutes} min</span>
                </div>
              </div>
              <div className="ml-auto text-sm font-semibold text-indigo-600">
                {doneRuns.length}/{plannedRuns.length}
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
              <Dumbbell className="h-5 w-5 text-emerald-500" />
              <div>
                <div className="text-xs font-medium text-slate-500">Minutos Gym</div>
                <div className="font-semibold text-slate-900">
                  {doneGymMinutes} <span className="text-sm font-normal text-slate-500">/ {plannedGymMinutes} min</span>
                </div>
              </div>
              <div className="ml-auto text-sm font-semibold text-emerald-600">
                {doneGym.length}/{plannedGym.length}
              </div>
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {plannedDays.map((d) => {
              const key = dateKey(d);
              const p = plannedByDate.get(key)!;
              const actual = workoutsThisWeek.find((w) => w.date === key);

              const isChanged = !!actual && p.type !== "rest" && actual.type !== p.type;

              return (
                <div
                  key={key}
                  className={
                    "flex items-center justify-between rounded-lg border bg-white px-3 py-2.5 transition-colors " +
                    (actual ? "border-emerald-100" : "border-slate-200")
                  }
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-500">{format(d, "EEE dd MMM")}</div>
                    <div className="text-sm font-medium text-slate-900">{p.type === "rest" ? "Descanso" : p.title}</div>
                    {actual ? (
                      <div className="mt-1 text-xs text-slate-500">
                        Hecho: {typeLabel(actual.type)}{actual.minutes ? ` · ${actual.minutes}m` : ""}{actual.rpe ? ` · RPE ${actual.rpe}/10` : ""}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    <Badge variant={p.type === "rest" ? "default" : "planned"}>{typeLabel(p.type)}</Badge>
                    {p.targetMinutes ? <Badge variant="default">{p.targetMinutes}m</Badge> : null}
                    {actual ? <Badge variant="done">Hecho</Badge> : p.type !== "rest" ? <Badge variant="pending">Pendiente</Badge> : null}
                    {isChanged ? <Badge variant="changed">Cambiado</Badge> : null}
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
