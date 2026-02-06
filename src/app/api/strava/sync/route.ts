import { NextRequest } from "next/server";
import {
  getValidAccessToken,
  fetchActivities,
  mapStravaType,
  stravaActivityToNotes,
} from "@/lib/strava";
import { upsertFile } from "@/lib/github";
import type { Workout } from "@/lib/workouts";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // Default: sync last 7 days
    const daysBack = Number(body.days) || 7;
    const afterEpoch = Math.floor(Date.now() / 1000) - daysBack * 86400;

    const { token } = await getValidAccessToken();
    const activities = await fetchActivities(token, afterEpoch);

    let synced = 0;
    let skipped = 0;

    for (const a of activities) {
      // Extract date from start_date_local (ISO 8601)
      const dateStr = a.start_date_local.slice(0, 10); // YYYY-MM-DD
      const type = mapStravaType(a.type);
      const minutes = Math.round(a.moving_time / 60);
      const notes = stravaActivityToNotes(a);

      const workout: Workout = {
        date: dateStr,
        type,
        minutes,
        notes,
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

    return Response.json({
      ok: true,
      total: activities.length,
      synced,
      skipped,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Sync failed";
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
