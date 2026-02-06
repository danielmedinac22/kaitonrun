import { NextRequest } from "next/server";
import {
  getValidAccessToken,
  fetchActivities,
  mapStravaType,
  stravaActivityToNotes,
  isRunActivity,
  saveTokens,
} from "@/lib/strava";
import { upsertFile } from "@/lib/github";
import type { Workout } from "@/lib/workouts";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // Default: sync last 7 days, runs only
    const daysBack = Number(body.days) || 7;
    const runsOnly = body.runsOnly !== false; // default true
    const afterEpoch = Math.floor(Date.now() / 1000) - daysBack * 86400;

    const { token, tokens } = await getValidAccessToken();
    const activities = await fetchActivities(token, afterEpoch);

    // Filter to runs only if requested
    const toSync = runsOnly
      ? activities.filter((a) => isRunActivity(a.type))
      : activities;

    let synced = 0;
    let skipped = 0;

    for (const a of toSync) {
      const dateStr = a.start_date_local.slice(0, 10);
      const type = runsOnly ? ("run" as const) : mapStravaType(a.type);
      const minutes = Math.round(a.moving_time / 60);
      const notes = stravaActivityToNotes(a);

      const workout: Workout = {
        date: dateStr,
        type,
        minutes,
        notes,
        source: "strava",
      };

      const filePath = `data/workouts/${dateStr}.json`;

      try {
        await upsertFile({
          pathInRepo: filePath,
          content: JSON.stringify(workout, null, 2),
          message: `Sync from Strava: ${a.name} (${dateStr})`,
        });
        synced++;
      } catch {
        skipped++;
      }
    }

    // Update last sync time
    tokens.last_sync_at = Math.floor(Date.now() / 1000);
    try {
      await saveTokens(tokens);
    } catch {
      // non-critical
    }

    return Response.json({
      ok: true,
      total: activities.length,
      runs: toSync.length,
      synced,
      skipped,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Sync failed";
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
