import { NextResponse } from "next/server";
import { upsertWorkout } from "@/lib/workouts";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const date = String(body.date || "").slice(0, 10);
    const type = String(body.type || "run") as "run" | "gym" | "rest";
    const minutes = body.minutes ? Number(body.minutes) : undefined;
    const rpe = body.rpe ? Number(body.rpe) : undefined;
    const notes = body.notes ? String(body.notes) : undefined;

    if (!date) return NextResponse.json({ error: "Missing date" }, { status: 400 });

    const workout = { date, type, minutes, rpe, notes, source: "manual" as const };

    await upsertWorkout(workout);

    return NextResponse.json({ ok: true, path: `workouts/${date}` });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
