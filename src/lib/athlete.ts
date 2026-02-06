import { getFileContent, upsertFile } from "@/lib/github";

// --- Athlete Profile (persisted in GitHub) ---

export type HRZone = { min: number; max: number };

export type TrainingZones = {
  hr_max: number;
  hr_rest: number;
  hr_zones: {
    z1: HRZone;
    z2: HRZone;
    z3: HRZone;
    z4: HRZone;
    z5: HRZone;
  };
  lactate_threshold_hr: number;
  aerobic_threshold_hr: number;
  pace_zones?: {
    easy: string;
    tempo: string;
    threshold: string;
    interval: string;
    sprint: string;
  };
  calculated_at: string; // ISO date
  data_range_days: number;
  notes?: string;
};

export type AthleteGoals = {
  race_date: string;
  race_distance: string;
  target_time?: string;
  five_k_target?: string;
  ten_k_target?: string;
  notes?: string;
};

export type AthleteProfile = {
  name?: string;
  age?: number;
  zones?: TrainingZones;
  goals?: AthleteGoals;
  coach_notes?: string; // persistent notes from the coach
  updated_at: string;
};

const PROFILE_PATH = "data/athlete-profile.json";

export async function loadProfile(): Promise<AthleteProfile | null> {
  const txt = await getFileContent(PROFILE_PATH);
  if (!txt) return null;
  try {
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

export async function saveProfile(profile: AthleteProfile): Promise<void> {
  profile.updated_at = new Date().toISOString();
  await upsertFile({
    pathInRepo: PROFILE_PATH,
    content: JSON.stringify(profile, null, 2),
    message: "Update athlete profile",
  });
}

// --- Plan Overrides (persisted in GitHub) ---

export type PlanOverride = {
  type: "run" | "gym" | "rest";
  title: string;
  targetMinutes?: number;
  rpe?: string;
  details: string[];
  coachNote?: string;
  created_at: string;
};

export type PlanOverrides = Record<string, PlanOverride>; // key = YYYY-MM-DD

const OVERRIDES_PATH = "data/plan-overrides.json";

export async function loadOverrides(): Promise<PlanOverrides> {
  const txt = await getFileContent(OVERRIDES_PATH);
  if (!txt) return {};
  try {
    return JSON.parse(txt);
  } catch {
    return {};
  }
}

export async function saveOverrides(overrides: PlanOverrides): Promise<void> {
  await upsertFile({
    pathInRepo: OVERRIDES_PATH,
    content: JSON.stringify(overrides, null, 2),
    message: "Update plan overrides",
  });
}
