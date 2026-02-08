import { addDays, format, startOfWeek, startOfMonth, endOfMonth, differenceInCalendarDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";

import { planWithOverrides, planForDate, programMeta } from "@/lib/plan";
import { readWorkouts, workoutByDate } from "@/lib/workouts";
import { loadOverrides, loadProfile } from "@/lib/athlete";

import RaceHeroCard from "./ui/RaceHeroCard";
import PlanProgressSummary from "./ui/PlanProgressSummary";
import WeekStripNav from "./ui/WeekStripNav";
import TodaySessionCard from "./ui/TodaySessionCard";
import UpcomingSessionsList from "./ui/UpcomingSessionsList";
import MonthCalendarView from "./ui/MonthCalendarView";
import type { SessionDay } from "./ui/UpcomingSessionsList";

export const dynamic = "force-dynamic";

const plannedDow = new Set([0, 1, 2, 4, 5]); // Sun Tue Thu + Mon Fri (gym)
const trainingDow = new Set([0, 2, 4]); // Sun Tue Thu (run days)

function dateKey(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export default async function EntrenamientosPage() {
  const today = new Date();
  const todayKey = dateKey(today);
  const base = startOfWeek(today, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }).map((_, i) => addDays(base, i));

  const workouts = await readWorkouts();
  const byDate = workoutByDate(workouts);
  const overrides = await loadOverrides();
  const profile = await loadProfile();

  const todayLogged = byDate.get(todayKey);
  const todayDow = today.getDay();
  const todayPlan = planWithOverrides(today, overrides);
  const { phase, weekIndex } = programMeta(today);

  const todayBadge = todayLogged
    ? { v: "done" as const, t: "Hecho" }
    : trainingDow.has(todayDow) || todayDow === 1 || todayDow === 5
      ? { v: "pending" as const, t: "Pendiente" }
      : { v: "default" as const, t: "Libre" };

  // Week progress (only run days for primary metric)
  const weekPlanned = days.filter((d) => trainingDow.has(d.getDay())).length;
  const weekDone = days.filter((d) => {
    const w = byDate.get(dateKey(d));
    return w && w.type === "run";
  }).length;
  const weekPct = weekPlanned > 0 ? Math.round((weekDone / weekPlanned) * 100) : 0;

  // Total plan stats — real count from plan start date
  const PLAN_START = parseISO(process.env.NEXT_PUBLIC_PLAN_START_DATE || "2026-02-05");
  const daysSinceStart = Math.max(0, differenceInCalendarDays(today, PLAN_START));
  let plannedSessions = 0;
  let plannedMinutes = 0;
  for (let i = 0; i <= daysSinceStart; i++) {
    const d = addDays(PLAN_START, i);
    const plan = planForDate(d);
    if (plan.type !== "rest") {
      plannedSessions++;
      plannedMinutes += plan.targetMinutes ?? 0;
    }
  }
  const startKey = format(PLAN_START, "yyyy-MM-dd");
  const doneSessions = workouts.filter((w) => w.type !== "rest" && w.date >= startKey).length;
  const doneMinutes = workouts.filter((w) => w.date >= startKey).reduce((acc, w) => acc + (w.minutes ?? 0), 0);

  // Week strip data
  const stripDays = days.map((d) => {
    const key = dateKey(d);
    const plan = planWithOverrides(d, overrides);
    return {
      date: key,
      dow: format(d, "EEEEEE", { locale: es }).toUpperCase(),
      dayNum: format(d, "d"),
      type: plan.type,
      done: byDate.has(key),
      isToday: key === todayKey,
    };
  });

  // Upcoming sessions: next 14 days, only non-rest
  const upcomingSessions: SessionDay[] = [];
  for (let i = 0; i < 14; i++) {
    const d = addDays(today, i);
    const key = dateKey(d);
    const plan = planWithOverrides(d, overrides);
    if (plan.type === "rest") continue;
    upcomingSessions.push({
      date: key,
      plan,
      workout: byDate.get(key),
      isToday: i === 0,
    });
  }

  // Calendar data: current month + next month
  const calendarDays: {
    date: string;
    type: "run" | "gym" | "rest";
    done: boolean;
    title: string;
    targetMinutes?: number;
    rpe?: string;
    details: string[];
  }[] = [];
  const calStart = startOfMonth(today);
  const calEnd = endOfMonth(addDays(calStart, 45)); // ~2 months
  let cursor = calStart;
  while (cursor <= calEnd) {
    const key = dateKey(cursor);
    const plan = planForDate(cursor);
    calendarDays.push({
      date: key,
      type: plan.type,
      done: byDate.has(key),
      title: plan.title,
      targetMinutes: plan.targetMinutes,
      rpe: plan.rpe,
      details: plan.details,
    });
    cursor = addDays(cursor, 1);
  }

  // Show today card only if it's a training day
  const showTodayCard = todayPlan.type !== "rest";

  // Goal time from profile
  const goalTime = profile?.goals?.target_time;

  return (
    <main className="space-y-4">
      <RaceHeroCard phase={phase} weekIndex={weekIndex} goalTime={goalTime} />

      <PlanProgressSummary
        doneCount={doneSessions}
        plannedCount={plannedSessions}
        doneMinutes={doneMinutes}
        plannedMinutes={plannedMinutes}
        weekPct={weekPct}
      />

      {/* Week strip + progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-txt-primary">Semana {weekIndex}</span>
          <div className="flex items-center gap-2 text-xs text-txt-secondary">
            <span className="font-semibold text-primary">{weekDone}/{weekPlanned}</span>
            <span>({weekPct}%)</span>
          </div>
        </div>
        <WeekStripNav days={stripDays} />
      </div>

      {showTodayCard && (
        <TodaySessionCard
          todayKey={todayKey}
          todayLogged={todayLogged}
          todayPlan={todayPlan}
          todayBadge={todayBadge}
        />
      )}

      <UpcomingSessionsList sessions={upcomingSessions} />

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-txt-primary">Calendario</h3>
        <MonthCalendarView days={calendarDays} />
      </div>
    </main>
  );
}
