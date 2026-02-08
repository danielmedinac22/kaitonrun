/**
 * Migration script: reads local JSON data files and inserts them into Supabase.
 *
 * Usage:
 *   npx tsx scripts/migrate-to-supabase.ts
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";

// Load .env.local
import { config } from "dotenv";
config({ path: join(__dirname, "..", ".env.local") });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const dataDir = join(__dirname, "..", "data");

async function migrateWorkouts() {
  const dir = join(dataDir, "workouts");
  if (!existsSync(dir)) {
    console.log("No workouts directory found, skipping.");
    return 0;
  }

  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  const rows = [];

  for (const file of files) {
    const raw = readFileSync(join(dir, file), "utf-8");
    const w = JSON.parse(raw);
    rows.push({
      date: w.date,
      type: w.type,
      minutes: w.minutes ?? null,
      rpe: w.rpe ?? null,
      notes: w.notes ?? null,
      source: w.source ?? null,
    });
  }

  if (rows.length === 0) return 0;

  const { error } = await supabase
    .from("workouts")
    .upsert(rows, { onConflict: "date" });

  if (error) throw new Error(`Workouts migration failed: ${error.message}`);
  return rows.length;
}

async function migrateAthleteProfile() {
  const file = join(dataDir, "athlete-profile.json");
  if (!existsSync(file)) {
    console.log("No athlete-profile.json found, skipping.");
    return false;
  }

  const raw = readFileSync(file, "utf-8");
  const p = JSON.parse(raw);

  const { error } = await supabase.from("athlete_profile").upsert(
    {
      id: 1,
      name: p.name ?? null,
      age: p.age ?? null,
      zones: p.zones ?? null,
      goals: p.goals ?? null,
      coach_notes: p.coach_notes ?? null,
      updated_at: p.updated_at ?? new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) throw new Error(`Athlete profile migration failed: ${error.message}`);
  return true;
}

async function migratePlanOverrides() {
  const file = join(dataDir, "plan-overrides.json");
  if (!existsSync(file)) {
    console.log("No plan-overrides.json found, skipping.");
    return 0;
  }

  const raw = readFileSync(file, "utf-8");
  const overrides = JSON.parse(raw) as Record<string, any>;

  const rows = Object.entries(overrides).map(([date, o]) => ({
    date,
    type: o.type,
    title: o.title,
    target_minutes: o.targetMinutes ?? null,
    rpe: o.rpe ?? null,
    details: o.details ?? [],
    coach_note: o.coachNote ?? null,
    created_at: o.created_at ?? new Date().toISOString(),
  }));

  if (rows.length === 0) return 0;

  const { error } = await supabase
    .from("plan_overrides")
    .upsert(rows, { onConflict: "date" });

  if (error) throw new Error(`Plan overrides migration failed: ${error.message}`);
  return rows.length;
}

async function migrateStravaTokens() {
  const file = join(dataDir, "strava-tokens.json");
  if (!existsSync(file)) {
    console.log("No strava-tokens.json found, skipping.");
    return false;
  }

  const raw = readFileSync(file, "utf-8");
  const t = JSON.parse(raw);

  const { error } = await supabase.from("strava_tokens").upsert(
    {
      id: 1,
      access_token: t.access_token,
      refresh_token: t.refresh_token,
      expires_at: t.expires_at,
      athlete_id: t.athlete_id,
      athlete_name: t.athlete_name ?? "",
      last_sync_at: t.last_sync_at ?? null,
    },
    { onConflict: "id" },
  );

  if (error) throw new Error(`Strava tokens migration failed: ${error.message}`);
  return true;
}

async function main() {
  console.log("Starting migration to Supabase...\n");

  const workoutCount = await migrateWorkouts();
  console.log(`Workouts: ${workoutCount} migrated`);

  const profileDone = await migrateAthleteProfile();
  console.log(`Athlete profile: ${profileDone ? "migrated" : "skipped"}`);

  const overrideCount = await migratePlanOverrides();
  console.log(`Plan overrides: ${overrideCount} migrated`);

  const tokensDone = await migrateStravaTokens();
  console.log(`Strava tokens: ${tokensDone ? "migrated" : "skipped"}`);

  console.log("\nMigration complete!");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
