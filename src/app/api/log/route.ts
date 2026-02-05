import { NextResponse } from "next/server";
import { upsertFile } from "@/lib/github";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const date = String(body.date || "").slice(0, 10);
    const type = String(body.type || "run");
    const minutes = body.minutes ? Number(body.minutes) : undefined;
    const rpe = body.rpe ? Number(body.rpe) : undefined;
    const notes = body.notes ? String(body.notes) : undefined;

    if (!date) return NextResponse.json({ error: "Missing date" }, { status: 400 });

    const workout = { date, type, minutes, rpe, notes };
    const pathInRepo = `data/workouts/${date}.json`;

    await upsertFile({
      pathInRepo,
      content: JSON.stringify(workout, null, 2),
      message: `log: workout ${date}`,
    });

    return NextResponse.json({ ok: true, path: pathInRepo });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
