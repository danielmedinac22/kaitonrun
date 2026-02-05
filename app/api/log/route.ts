import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  const body = await req.json();
  const date = String(body.date || "").slice(0, 10);
  const type = String(body.type || "run");
  const minutes = body.minutes ? Number(body.minutes) : undefined;
  const rpe = body.rpe ? Number(body.rpe) : undefined;
  const notes = body.notes ? String(body.notes) : undefined;

  if (!date) return new NextResponse("Missing date", { status: 400 });

  const workout = { date, type, minutes, rpe, notes };

  const dir = path.join(process.cwd(), "data", "workouts");
  fs.mkdirSync(dir, { recursive: true });
  const outPath = path.join(dir, `${date}.json`);
  fs.writeFileSync(outPath, JSON.stringify(workout, null, 2));

  return NextResponse.json({ ok: true, path: `data/workouts/${date}.json` });
}
