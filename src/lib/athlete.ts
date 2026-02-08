import { supabase } from "@/lib/supabase";

// --- Athlete Profile (persisted in Supabase) ---

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

export async function loadProfile(): Promise<AthleteProfile | null> {
  const { data, error } = await supabase()
    .from("athlete_profile")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // no rows
    throw new Error(`loadProfile failed: ${error.message}`);
  }

  return {
    name: data.name ?? undefined,
    age: data.age ?? undefined,
    zones: data.zones ?? undefined,
    goals: data.goals ?? undefined,
    coach_notes: data.coach_notes ?? undefined,
    updated_at: data.updated_at,
  };
}

export async function saveProfile(profile: AthleteProfile): Promise<void> {
  profile.updated_at = new Date().toISOString();

  const { error } = await supabase()
    .from("athlete_profile")
    .upsert(
      {
        id: 1,
        name: profile.name ?? null,
        age: profile.age ?? null,
        zones: profile.zones ?? null,
        goals: profile.goals ?? null,
        coach_notes: profile.coach_notes ?? null,
        updated_at: profile.updated_at,
      },
      { onConflict: "id" },
    );

  if (error) throw new Error(`saveProfile failed: ${error.message}`);
}

// --- Plan Overrides (persisted in Supabase) ---

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

export async function loadOverrides(): Promise<PlanOverrides> {
  const { data, error } = await supabase()
    .from("plan_overrides")
    .select("*");

  if (error) throw new Error(`loadOverrides failed: ${error.message}`);

  const result: PlanOverrides = {};
  for (const row of data ?? []) {
    result[row.date] = {
      type: row.type,
      title: row.title,
      targetMinutes: row.target_minutes ?? undefined,
      rpe: row.rpe ?? undefined,
      details: row.details ?? [],
      coachNote: row.coach_note ?? undefined,
      created_at: row.created_at,
    };
  }
  return result;
}

export async function saveOverrides(overrides: PlanOverrides): Promise<void> {
  const rows = Object.entries(overrides).map(([date, o]) => ({
    date,
    type: o.type,
    title: o.title,
    target_minutes: o.targetMinutes ?? null,
    rpe: o.rpe ?? null,
    details: o.details ?? [],
    coach_note: o.coachNote ?? null,
    created_at: o.created_at,
  }));

  if (rows.length === 0) return;

  const { error } = await supabase()
    .from("plan_overrides")
    .upsert(rows, { onConflict: "date" });

  if (error) throw new Error(`saveOverrides failed: ${error.message}`);
}
