export type WorkoutType = "run" | "gym" | "rest";
export type Workout = {
  date: string; // YYYY-MM-DD
  type: WorkoutType;
  minutes?: number;
  rpe?: number;
  notes?: string;
  source?: "strava" | "manual";
};

import { supabase } from "@/lib/supabase";

export async function readWorkouts(): Promise<Workout[]> {
  const { data, error } = await supabase()
    .from("workouts")
    .select("*")
    .order("date", { ascending: false });

  if (error) throw new Error(`readWorkouts failed: ${error.message}`);

  return (data ?? []).map((row) => ({
    date: row.date,
    type: row.type,
    minutes: row.minutes ?? undefined,
    rpe: row.rpe ?? undefined,
    notes: row.notes ?? undefined,
    source: row.source ?? undefined,
  }));
}

export async function upsertWorkout(workout: Workout): Promise<void> {
  const { error } = await supabase()
    .from("workouts")
    .upsert(
      {
        date: workout.date,
        type: workout.type,
        minutes: workout.minutes ?? null,
        rpe: workout.rpe ?? null,
        notes: workout.notes ?? null,
        source: workout.source ?? null,
      },
      { onConflict: "date" },
    );

  if (error) throw new Error(`upsertWorkout failed: ${error.message}`);
}

export function workoutByDate(workouts: Workout[]) {
  const m = new Map<string, Workout>();
  for (const w of workouts) m.set(w.date, w);
  return m;
}
