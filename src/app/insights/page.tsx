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

export default async function InsightsPage() {
  const workouts = await readWorkouts();

  const today = new Date();
  const start = startOfWeek(today, { weekStartsOn: 1 });
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const plannedDays = Array.from({ length: 7 }).map((_, i) => {
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
            <Button asChild variant="secondary">
              <Link href="/api/export?format=csv">Descargar CSV</Link>
            </Button>
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
            Lo planeado según el programa. Runs: {doneRuns.length}/{plannedRuns.length} ({pct(doneRuns.length, plannedRuns.length)}%) · Gym: {doneGym.length}/{plannedGym.length} ({pct(doneGym.length, plannedGym.length)}%)
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
              const p = planForDate(d);
              return (
                <div key={dateKey(d)} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <div>
                    <div className="text-xs font-semibold text-slate-500">{format(d, "EEE dd MMM")}</div>
                    <div className="text-sm font-medium text-slate-900">{p.type === "rest" ? "Descanso" : p.title}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={p.type === "rest" ? "default" : "planned"}>{typeLabel(p.type)}</Badge>
                    {p.targetMinutes ? <Badge variant="default">{p.targetMinutes}m</Badge> : null}
                    {p.rpe ? <Badge variant="default">RPE {p.rpe}</Badge> : null}
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
