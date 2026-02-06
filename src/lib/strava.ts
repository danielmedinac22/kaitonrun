import { getFileContent, upsertFile } from "@/lib/github";

// --- Config ---

function stravaClientId(): string {
  const id = process.env.STRAVA_CLIENT_ID;
  if (!id) throw new Error("Missing env var: STRAVA_CLIENT_ID");
  return id;
}

function stravaClientSecret(): string {
  const secret = process.env.STRAVA_CLIENT_SECRET;
  if (!secret) throw new Error("Missing env var: STRAVA_CLIENT_SECRET");
  return secret;
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

// --- OAuth ---

export function stravaAuthorizeUrl(): string {
  const params = new URLSearchParams({
    client_id: stravaClientId(),
    redirect_uri: `${appUrl()}/api/strava/callback`,
    response_type: "code",
    approval_prompt: "auto",
    scope: "activity:read_all",
  });
  return `https://www.strava.com/oauth/authorize?${params}`;
}

export type StravaTokens = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete_id: number;
  athlete_name: string;
};

export async function exchangeCode(code: string): Promise<StravaTokens> {
  const res = await fetch("https://www.strava.com/api/v3/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: stravaClientId(),
      client_secret: stravaClientSecret(),
      code,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Strava token exchange failed (${res.status}): ${txt}`);
  }
  const data = await res.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
    athlete_id: data.athlete?.id,
    athlete_name: `${data.athlete?.firstname ?? ""} ${data.athlete?.lastname ?? ""}`.trim(),
  };
}

async function refreshTokens(refreshToken: string): Promise<StravaTokens> {
  const res = await fetch("https://www.strava.com/api/v3/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: stravaClientId(),
      client_secret: stravaClientSecret(),
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Strava token refresh failed (${res.status}): ${txt}`);
  }
  const data = await res.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
    athlete_id: 0,
    athlete_name: "",
  };
}

// --- Token Persistence (GitHub) ---

const TOKENS_PATH = "data/strava-tokens.json";

export async function loadTokens(): Promise<StravaTokens | null> {
  const txt = await getFileContent(TOKENS_PATH);
  if (!txt) return null;
  try {
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

export async function saveTokens(tokens: StravaTokens): Promise<void> {
  await upsertFile({
    pathInRepo: TOKENS_PATH,
    content: JSON.stringify(tokens, null, 2),
    message: "Update Strava tokens",
  });
}

export async function getValidAccessToken(): Promise<{ token: string; tokens: StravaTokens }> {
  const tokens = await loadTokens();
  if (!tokens) throw new Error("Strava not connected");

  const now = Math.floor(Date.now() / 1000);
  if (now < tokens.expires_at - 60) {
    return { token: tokens.access_token, tokens };
  }

  // Refresh
  const refreshed = await refreshTokens(tokens.refresh_token);
  refreshed.athlete_id = tokens.athlete_id;
  refreshed.athlete_name = tokens.athlete_name;
  await saveTokens(refreshed);
  return { token: refreshed.access_token, tokens: refreshed };
}

// --- Activities ---

export type StravaActivity = {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  start_date: string;
  start_date_local: string;
  average_heartrate?: number;
  max_heartrate?: number;
  suffer_score?: number;
  total_elevation_gain?: number;
};

export async function fetchActivities(
  accessToken: string,
  afterEpoch: number,
  perPage = 50,
): Promise<StravaActivity[]> {
  const all: StravaActivity[] = [];
  let page = 1;

  while (page <= 10) {
    const url = new URL("https://www.strava.com/api/v3/athlete/activities");
    url.searchParams.set("after", String(afterEpoch));
    url.searchParams.set("per_page", String(perPage));
    url.searchParams.set("page", String(page));

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Strava activities fetch failed (${res.status}): ${txt}`);
    }
    const batch: StravaActivity[] = await res.json();
    if (batch.length === 0) break;
    all.push(...batch);
    if (batch.length < perPage) break;
    page++;
  }

  return all;
}

// --- Mapping ---

export function mapStravaType(stravaType: string): "run" | "gym" | "rest" {
  const t = stravaType.toLowerCase();
  if (t === "run" || t === "trail run" || t === "virtualrun") return "run";
  if (
    t === "weighttraining" ||
    t === "crossfit" ||
    t === "workout" ||
    t === "yoga" ||
    t === "pilates"
  )
    return "gym";
  // Walk, Hike, Ride, Swim, etc. — default to run for cardio, rest for others
  if (t === "walk" || t === "hike") return "rest";
  // Other cardio types (ride, swim, etc.) map to run to count as activity
  return "run";
}

export function stravaActivityToNotes(a: StravaActivity): string {
  const parts: string[] = [`Strava: ${a.name}`];
  if (a.distance > 0) {
    parts.push(`${(a.distance / 1000).toFixed(2)} km`);
  }
  if (a.average_heartrate) {
    parts.push(`FC avg ${Math.round(a.average_heartrate)} bpm`);
  }
  if (a.total_elevation_gain && a.total_elevation_gain > 0) {
    parts.push(`${Math.round(a.total_elevation_gain)}m D+`);
  }
  return parts.join(" · ");
}
