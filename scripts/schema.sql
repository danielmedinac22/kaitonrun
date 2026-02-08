-- KaitonRun: Supabase schema
-- Run this in the Supabase SQL editor to create all tables

-- WORKOUTS (reemplaza data/workouts/{YYYY-MM-DD}.json)
CREATE TABLE workouts (
  date       DATE PRIMARY KEY,
  type       TEXT NOT NULL CHECK (type IN ('run', 'gym', 'rest')),
  minutes    INTEGER,
  rpe        INTEGER,
  notes      TEXT,
  source     TEXT CHECK (source IN ('strava', 'manual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_workouts_date ON workouts (date DESC);

-- ATHLETE PROFILE (reemplaza data/athlete-profile.json)
CREATE TABLE athlete_profile (
  id          INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name        TEXT,
  age         INTEGER,
  zones       JSONB,
  goals       JSONB,
  coach_notes TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PLAN OVERRIDES (reemplaza data/plan-overrides.json)
CREATE TABLE plan_overrides (
  date            DATE PRIMARY KEY,
  type            TEXT NOT NULL CHECK (type IN ('run', 'gym', 'rest')),
  title           TEXT NOT NULL,
  target_minutes  INTEGER,
  rpe             TEXT,
  details         JSONB NOT NULL DEFAULT '[]',
  coach_note      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- STRAVA TOKENS (reemplaza data/strava-tokens.json)
CREATE TABLE strava_tokens (
  id             INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  access_token   TEXT NOT NULL,
  refresh_token  TEXT NOT NULL,
  expires_at     BIGINT NOT NULL,
  athlete_id     BIGINT NOT NULL,
  athlete_name   TEXT NOT NULL DEFAULT '',
  last_sync_at   BIGINT,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS + policies (single-user, permitir todo)
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE strava_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON workouts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON athlete_profile FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON plan_overrides FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON strava_tokens FOR ALL USING (true) WITH CHECK (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER workouts_updated_at BEFORE UPDATE ON workouts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER athlete_profile_updated_at BEFORE UPDATE ON athlete_profile FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER strava_tokens_updated_at BEFORE UPDATE ON strava_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at();
