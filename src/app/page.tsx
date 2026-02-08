import { addDays, format, startOfWeek } from "date-fns";

import TodayHeroCard from "@/app/ui/TodayHeroCard";
import CoachInsightCard from "@/app/ui/CoachInsightCard";
import WeeklyProgressSummary from "@/app/ui/WeeklyProgressSummary";
import { planWithOverrides, programMeta } from "@/lib/plan";
import { readWorkouts, workoutByDate } from "@/lib/workouts";
import { autoSyncRuns } from "@/lib/strava";
import { loadOverrides, loadProfile } from "@/lib/athlete";
import { computeKPIs } from "@/lib/stats";

export const dynamic = "force-dynamic";

const plannedDow = new Set([2, 4, 0]); // Tue Thu Sun

function dateKey(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export default async function HomePage() {
  // Auto-sync runs from Strava (respects 1-hour cooldown)
  await autoSyncRuns(7);

  const base = startOfWeek(new Date(), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }).map((_, i) => addDays(base, i));

  const workouts = await readWorkouts();
  const byDate = workoutByDate(workouts);
  const overrides = await loadOverrides();
  const profile = await loadProfile();

  const today = new Date();
  const todayKey = dateKey(today);
  const todayLogged = byDate.get(todayKey);
  const todayPlan = planWithOverrides(today, overrides);
  const { weekIndex, phase, weeksToRace } = programMeta(today);

  // Week progress
  const weekPlanned = days.filter((d) => plannedDow.has(d.getDay())).length;
  const weekDone = days.filter((d) => byDate.has(dateKey(d))).length;
  const weekPct = weekPlanned > 0 ? Math.round((weekDone / weekPlanned) * 100) : 0;

  // Weekly minutes
  const weekMinutes = days.reduce(
    (acc, d) => acc + (byDate.get(dateKey(d))?.minutes ?? 0),
    0,
  );

  // Streak
  const { streak } = computeKPIs(
    workouts,
    { start: days[0], end: addDays(days[6], 1) },
    workouts,
  );

  // Find next planned session
  let nextSessionDate: Date | null = null;
  let nextSessionPlan = todayPlan;
  for (let i = 1; i <= 7; i++) {
    const d = addDays(today, i);
    if (plannedDow.has(d.getDay()) && !byDate.has(dateKey(d))) {
      nextSessionDate = d;
      nextSessionPlan = planWithOverrides(d, overrides);
      break;
    }
  }

  return (
    <main className="stagger-children space-y-4">
      {/* 1. Hero: Today's session */}
      <TodayHeroCard
        todayPlan={todayPlan}
        todayLogged={todayLogged}
        weekIndex={weekIndex}
        phase={phase}
        weeksToRace={weeksToRace}
        nextSessionDate={nextSessionDate}
        nextSessionPlan={nextSessionPlan}
        name={profile?.name}
      />

      {/* 2. Coach insight (renders null if no notes) */}
      <CoachInsightCard overrides={overrides} />

      {/* 3. Weekly progress */}
      <WeeklyProgressSummary
        weekPct={weekPct}
        weekDone={weekDone}
        weekPlanned={weekPlanned}
        streak={streak}
        weekMinutes={weekMinutes}
      />
    </main>
  );
}
