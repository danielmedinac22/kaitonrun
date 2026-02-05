import fs from "fs";
import path from "path";

export type WorkoutType = "run" | "gym" | "rest";
export type Workout = {
  date: string; // YYYY-MM-DD
  type: WorkoutType;
  minutes?: number;
  rpe?: number;
  notes?: string;
};

export function workoutsDir() {
  return path.join(process.cwd(), "data", "workouts");
}

export function readWorkouts(): Workout[] {
  const dir = workoutsDir();
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  const out: Workout[] = [];
  for (const f of files) {
    try {
      const j = JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8"));
      out.push(j);
    } catch {}
  }
  return out;
}

export function workoutByDate(workouts: Workout[]) {
  const m = new Map<string, Workout>();
  for (const w of workouts) m.set(w.date, w);
  return m;
}
