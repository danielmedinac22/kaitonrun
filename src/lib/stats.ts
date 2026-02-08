import { format, parseISO, startOfWeek, subWeeks } from "date-fns";
import { planForDate } from "@/lib/plan";
import type { Workout } from "@/lib/workouts";

function dateKey(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function pct(n: number, d: number) {
  if (d <= 0) return 0;
  return Math.round((n / d) * 100);
}

export type KPIs = {
  completionPct: number;
  doneCount: number;
  plannedCount: number;
  doneMinutes: number;
  plannedMinutes: number;
  avgRpe: number | null;
  streak: number;
};

export function computeKPIs(
  workouts: Workout[],
  dateRange: { start: Date; end: Date },
  allWorkouts?: Workout[],
): KPIs {
  const { start, end } = dateRange;
  const daysInRange = Math.max(1, Math.min(365, Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))));
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

  const workoutsInRange = workouts.filter((w) => {
    const d = parseISO(w.date);
    return d >= start && d < end;
  });

  const doneCount = workoutsInRange.filter((w) => w.type !== "rest").length;
  const doneMinutes = workoutsInRange.reduce((acc, w) => acc + (w.minutes ?? 0), 0);

  const rpes = workoutsInRange
    .map((w) => (typeof w.rpe === "number" ? w.rpe : Number(w.rpe)))
    .filter((n) => Number.isFinite(n));

  const avgRpe = rpes.length
    ? Math.round((rpes.reduce((a, b) => a + b, 0) / rpes.length) * 10) / 10
    : null;

  // Streak: consecutive days with workouts from today backwards
  const all = allWorkouts ?? workouts;
  const byDate = new Set(all.map((w) => w.date));
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (byDate.has(dateKey(d))) streak++;
    else break;
  }

  return {
    completionPct: pct(doneCount, plannedCount),
    doneCount,
    plannedCount,
    doneMinutes,
    plannedMinutes,
    avgRpe,
    streak,
  };
}

export type TrendWeek = {
  wkStart: Date;
  minutes: number;
};

export function computeTrend(workouts: Workout[], weeks = 8): TrendWeek[] {
  const today = new Date();
  return Array.from({ length: weeks }).map((_, i) => {
    const wkStart = startOfWeek(subWeeks(today, weeks - 1 - i), { weekStartsOn: 1 });
    const wkEnd = new Date(wkStart);
    wkEnd.setDate(wkEnd.getDate() + 7);

    const wks = workouts.filter((w) => {
      const d = parseISO(w.date);
      return d >= wkStart && d < wkEnd;
    });

    const minutes = wks.reduce((acc, w) => acc + (w.minutes ?? 0), 0);
    return { wkStart, minutes };
  });
}

export type PersonalRecord = {
  label: string;
  value: string;
  date: string;
};

export function computePersonalRecords(workouts: Workout[]): PersonalRecord[] {
  const records: PersonalRecord[] = [];
  const runs = workouts.filter((w) => w.type === "run" && w.minutes);

  // Longest run
  if (runs.length > 0) {
    const longest = runs.reduce((a, b) => ((a.minutes ?? 0) > (b.minutes ?? 0) ? a : b));
    records.push({
      label: "Carrera ms larga",
      value: `${longest.minutes} min`,
      date: longest.date,
    });
  }

  // Most weekly volume
  const today = new Date();
  let maxWeekVol = 0;
  let maxWeekDate = "";
  for (let i = 0; i < 52; i++) {
    const wkStart = startOfWeek(subWeeks(today, i), { weekStartsOn: 1 });
    const wkEnd = new Date(wkStart);
    wkEnd.setDate(wkEnd.getDate() + 7);
    const vol = workouts
      .filter((w) => {
        const d = parseISO(w.date);
        return d >= wkStart && d < wkEnd;
      })
      .reduce((acc, w) => acc + (w.minutes ?? 0), 0);
    if (vol > maxWeekVol) {
      maxWeekVol = vol;
      maxWeekDate = format(wkStart, "yyyy-MM-dd");
    }
  }
  if (maxWeekVol > 0) {
    records.push({
      label: "Mayor volumen semanal",
      value: `${maxWeekVol} min`,
      date: maxWeekDate,
    });
  }

  // Best streak
  const sortedDates = [...new Set(workouts.map((w) => w.date))].sort();
  let bestStreak = 0;
  let currentStreak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = parseISO(sortedDates[i - 1]);
    const curr = parseISO(sortedDates[i]);
    const diff = Math.round((curr.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000));
    if (diff === 1) {
      currentStreak++;
    } else {
      bestStreak = Math.max(bestStreak, currentStreak);
      currentStreak = 1;
    }
  }
  bestStreak = Math.max(bestStreak, currentStreak);
  if (bestStreak > 1) {
    records.push({
      label: "Mejor racha",
      value: `${bestStreak} das`,
      date: "",
    });
  }

  return records;
}

export function computePaceTrend(workouts: Workout[]): { date: string; pace: number }[] {
  const paces: { date: string; pace: number }[] = [];
  const runs = workouts.filter((w) => w.type === "run" && w.notes);

  for (const w of runs) {
    const match = w.notes?.match(/[Rr]itmo\s+(\d+):(\d+)/);
    if (match) {
      const mins = parseInt(match[1], 10);
      const secs = parseInt(match[2], 10);
      paces.push({ date: w.date, pace: mins + secs / 60 });
    }
  }

  return paces.sort((a, b) => (a.date < b.date ? -1 : 1));
}

export function generateInsights(
  workouts: Workout[],
  dateRange: { start: Date; end: Date },
): string[] {
  const kpis = computeKPIs(workouts, dateRange, workouts);
  const insights: string[] = [];

  if (kpis.completionPct >= 90) {
    insights.push(`Cumplimiento del ${kpis.completionPct}% — excelente consistencia.`);
  } else if (kpis.completionPct >= 70) {
    insights.push(`Cumplimiento del ${kpis.completionPct}% — buen ritmo, mantenerlo.`);
  } else if (kpis.completionPct > 0) {
    insights.push(`Cumplimiento del ${kpis.completionPct}% — hay margen para mejorar la adherencia.`);
  }

  if (kpis.avgRpe !== null) {
    if (kpis.avgRpe >= 8) {
      insights.push(`RPE promedio alto (${kpis.avgRpe}/10) — considera una descarga o reducir intensidad.`);
    } else if (kpis.avgRpe >= 6) {
      insights.push(`RPE promedio de ${kpis.avgRpe}/10 — carga moderada-alta, monitorear fatiga.`);
    } else {
      insights.push(`RPE promedio de ${kpis.avgRpe}/10 — carga controlada.`);
    }
  }

  if (kpis.streak >= 7) {
    insights.push(`Racha activa de ${kpis.streak} das consecutivos.`);
  }

  // Volume trend
  const trend = computeTrend(workouts, 4);
  if (trend.length >= 2) {
    const recent = trend[trend.length - 1].minutes;
    const prev = trend[trend.length - 2].minutes;
    if (prev > 0) {
      const change = Math.round(((recent - prev) / prev) * 100);
      if (change > 10) {
        insights.push(`Volumen +${change}% vs semana anterior.`);
      } else if (change < -10) {
        insights.push(`Volumen ${change}% vs semana anterior.`);
      }
    }
  }

  return insights;
}
