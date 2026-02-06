import { NextRequest } from "next/server";
import { parseISO, subDays, addDays, format, startOfWeek } from "date-fns";
import {
  analyzeWorkout,
  preWorkoutBriefing,
  weeklyReview,
  calculateZones,
  suggestAdjustments,
} from "@/lib/coach";
import { readWorkouts } from "@/lib/workouts";
import { planForDate, programMeta } from "@/lib/plan";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action: string = body.action;

    if (!action) {
      return Response.json({ ok: false, error: "Missing action" }, { status: 400 });
    }

    const workouts = await readWorkouts();
    const today = new Date();

    // --- ANALYZE a specific workout ---
    if (action === "analyze") {
      const date = body.date || format(today, "yyyy-MM-dd");
      const workout = workouts.find((w) => w.date === date);
      if (!workout) {
        return Response.json({ ok: false, error: "No workout found for date" }, { status: 404 });
      }
      const planned = planForDate(parseISO(date));
      const meta = programMeta(parseISO(date));
      const recent = workouts
        .filter((w) => w.date < date && w.date >= format(subDays(parseISO(date), 14), "yyyy-MM-dd"))
        .sort((a, b) => (a.date > b.date ? -1 : 1))
        .slice(0, 10);

      const result = await analyzeWorkout(workout, planned, meta, recent);
      return Response.json({ ok: true, ...result });
    }

    // --- PRE-WORKOUT briefing ---
    if (action === "briefing") {
      const date = body.date || format(today, "yyyy-MM-dd");
      const planned = planForDate(parseISO(date));
      const meta = programMeta(parseISO(date));
      const recent = workouts
        .filter((w) => w.date < date)
        .sort((a, b) => (a.date > b.date ? -1 : 1))
        .slice(0, 10);

      const result = await preWorkoutBriefing(planned, meta, recent);
      return Response.json({ ok: true, ...result });
    }

    // --- WEEKLY review ---
    if (action === "weekly") {
      const meta = programMeta(today);
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const prevWeekStart = subDays(weekStart, 7);

      const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
      const weekPlans = weekDays.map((d) => ({
        date: format(d, "yyyy-MM-dd"),
        plan: planForDate(d),
      }));

      const weekWorkouts = workouts.filter((w) => {
        const d = parseISO(w.date);
        return d >= weekStart && d < addDays(weekStart, 7);
      });

      const prevWeekWorkouts = workouts.filter((w) => {
        const d = parseISO(w.date);
        return d >= prevWeekStart && d < weekStart;
      });

      const result = await weeklyReview(weekWorkouts, weekPlans, meta, prevWeekWorkouts);
      return Response.json({ ok: true, ...result });
    }

    // --- ZONES calculation ---
    if (action === "zones") {
      const meta = programMeta(today);
      const result = await calculateZones(
        workouts,
        meta,
        body.age ? Number(body.age) : undefined,
        body.restingHR ? Number(body.restingHR) : undefined,
        body.maxHR ? Number(body.maxHR) : undefined,
      );
      return Response.json({ ok: true, ...result });
    }

    // --- ADJUSTMENT suggestions ---
    if (action === "adjust") {
      const meta = programMeta(today);
      const recent = workouts
        .filter((w) => w.date >= format(subDays(today, 14), "yyyy-MM-dd"))
        .sort((a, b) => (a.date > b.date ? -1 : 1));

      const nextDays = Array.from({ length: 7 }).map((_, i) => addDays(today, i + 1));
      const upcomingPlans = nextDays.map((d) => ({
        date: format(d, "yyyy-MM-dd"),
        plan: planForDate(d),
      }));

      const result = await suggestAdjustments(recent, upcomingPlans, meta);
      return Response.json({ ok: true, ...result });
    }

    return Response.json({ ok: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Coach error";
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
