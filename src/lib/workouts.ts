export type WorkoutType = "run" | "gym" | "rest";
export type Workout = {
  date: string; // YYYY-MM-DD
  type: WorkoutType;
  minutes?: number;
  rpe?: number;
  notes?: string;
};

import { getFileContent, listRepoDir } from "@/lib/github";

export async function readWorkouts(): Promise<Workout[]> {
  const files = await listRepoDir("data/workouts");
  const jsonFiles = files
    .filter((f) => f.name.endsWith(".json"))
    .sort((a, b) => (a.name < b.name ? 1 : -1));

  const out: Workout[] = [];
  for (const f of jsonFiles.slice(0, 200)) {
    const txt = await getFileContent(f.path);
    if (!txt) continue;
    try {
      out.push(JSON.parse(txt));
    } catch {}
  }
  return out;
}

export function workoutByDate(workouts: Workout[]) {
  const m = new Map<string, Workout>();
  for (const w of workouts) m.set(w.date, w);
  return m;
}
