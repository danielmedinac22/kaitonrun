import { format, parseISO, startOfWeek, subWeeks } from "date-fns";

import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { readWorkouts } from "@/lib/workouts";
import { planForDate } from "@/lib/plan";

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

  // Weekly planned sessions = any non-rest plan item
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

  // Streak: consecutive days back from today with any log (non-empty)
  const byDate = new Set(workouts.map((w) => w.date));
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (byDate.has(dateKey(d))) streak++;
    else break;
  }

  // Last 8 weeks minutes trend (done)
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

  return (
    <main className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>Insights</CardTitle>
              <CardDescription>Resumen semanal y tendencia.</CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <form action="/insights" className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  Desde
                  <input
                    name="from"
                    defaultValue={searchParams?.from || ""}
                    type="date"
                    className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700"
                  />
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  Hasta
                  <input
                    name="to"
                    defaultValue={searchParams?.to || ""}
                    type="date"
                    className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700"
                  />
                </label>
                <Button type="submit" variant="secondary">
                  Ver
                </Button>
              </form>

              <Button asChild variant="secondary">
                <Link
                  href={
                    `/api/export?format=csv` +
                    (searchParams?.from ? `&from=${encodeURIComponent(searchParams.from)}` : "") +
                    (searchParams?.to ? `&to=${encodeURIComponent(searchParams.to)}` : "")
                  }
                >
                  Descargar CSV
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold text-slate-500">Cumplimiento (sesiones)</div>
              <div className="mt-2 flex items-baseline gap-2">
                <div className="text-2xl font-semibold text-slate-900">{pct(doneCount, plannedCount)}%</div>
                <div className="text-sm text-slate-500">
                  {doneCount}/{plannedCount}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold text-slate-500">Minutos (hechos vs plan)</div>
              <div className="mt-2 flex items-baseline gap-2">
                <div className="text-2xl font-semibold text-slate-900">{doneMinutes}</div>
                <div className="text-sm text-slate-500">/ {plannedMinutes} min</div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold text-slate-500">RPE promedio</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">{avgRpe ?? "—"}</div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold text-slate-500">Racha</div>
              <div className="mt-2 flex items-baseline gap-2">
                <div className="text-2xl font-semibold text-slate-900">{streak}</div>
                <div className="text-sm text-slate-500">días</div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 md:col-span-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-slate-700">
                  <span className="text-xs font-semibold text-slate-500">Cambios vs plan:</span>{" "}
                  <span className="font-semibold text-slate-900">{changedCount}</span>
                  <span className="text-slate-500"> esta semana</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="planned">Planned</Badge>
                  <Badge variant="done">Hecho</Badge>
                  <Badge variant="pending">Pendiente</Badge>
                  <Badge variant="default">Info</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Últimas 8 semanas</CardTitle>
          <CardDescription>Minutos registrados por semana.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {trendWeeks.map((t) => {
              const w = Math.round((clamp(t.minutes, 0, maxMinutes) / maxMinutes) * 100);
              return (
                <div key={t.wkStart.toISOString()} className="flex items-center gap-3">
                  <div className="w-28 text-xs font-semibold text-slate-600">{format(t.wkStart, "dd MMM")}</div>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-indigo-600" style={{ width: `${w}%` }} />
                  </div>
                  <div className="w-16 text-right text-xs text-slate-500">{t.minutes}m</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Esta semana (plan)</CardTitle>
          <CardDescription>
            {format(start, "dd MMM")} → {format(end, "dd MMM")} · Runs: {doneRuns.length}/{plannedRuns.length} ({pct(doneRuns.length, plannedRuns.length)}%) · Gym: {doneGym.length}/{plannedGym.length} ({pct(doneGym.length, plannedGym.length)}%)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-3 grid gap-2 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
              <div className="text-xs font-semibold text-slate-500">Minutos Run</div>
              <div className="mt-1 font-semibold text-slate-900">
                {doneRunMinutes} / {plannedRunMinutes} min
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
              <div className="text-xs font-semibold text-slate-500">Minutos Gym</div>
              <div className="mt-1 font-semibold text-slate-900">
                {doneGymMinutes} / {plannedGymMinutes} min
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
                <div key={key} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <div>
                    <div className="text-xs font-semibold text-slate-500">{format(d, "EEE dd MMM")}</div>
                    <div className="text-sm font-medium text-slate-900">{p.type === "rest" ? "Descanso" : p.title}</div>
                    {actual ? (
                      <div className="mt-1 text-xs text-slate-500">
                        Hecho: {typeLabel(actual.type)}{actual.minutes ? ` · ${actual.minutes}m` : ""}{actual.rpe ? ` · RPE ${actual.rpe}/10` : ""}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Badge variant={p.type === "rest" ? "default" : "planned"}>{typeLabel(p.type)}</Badge>
                    {p.targetMinutes ? <Badge variant="default">{p.targetMinutes}m</Badge> : null}
                    {p.rpe ? <Badge variant="default">RPE {p.rpe}</Badge> : null}
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
