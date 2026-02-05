import { NextResponse } from "next/server";
import { parseISO } from "date-fns";

import { readWorkouts } from "@/lib/workouts";
import { planForDate } from "@/lib/plan";

function asDate(s: string) {
  const d = parseISO(s);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function csvEscape(v: unknown) {
  const s = String(v ?? "");
  if (/[\n\r,\"]/g.test(s)) return `"${s.replace(/\"/g, '""')}"`;
  return s;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const format = (searchParams.get("format") || "csv").toLowerCase();

  const fromD = from ? asDate(from) : null;
  const toD = to ? asDate(to) : null;

  const workouts = await readWorkouts();

  const rows = workouts
    .filter((w) => {
      if (!fromD && !toD) return true;
      const d = parseISO(w.date);
      if (fromD && d < fromD) return false;
      if (toD && d > toD) return false;
      return true;
    })
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((w) => {
      const planned = planForDate(parseISO(w.date));
      return {
        date: w.date,
        actual_type: w.type,
        actual_minutes: w.minutes ?? "",
        actual_rpe: w.rpe ?? "",
        actual_notes: w.notes ?? "",
        planned_type: planned.type,
        planned_title: planned.title,
        planned_minutes: planned.targetMinutes ?? "",
        planned_rpe: planned.rpe ?? "",
      };
    });

  if (format === "json") {
    return NextResponse.json({ rows });
  }

  const headers = Object.keys(rows[0] || {
    date: "",
    actual_type: "",
    actual_minutes: "",
    actual_rpe: "",
    actual_notes: "",
    planned_type: "",
    planned_title: "",
    planned_minutes: "",
    planned_rpe: "",
  });

  const csv = [headers.join(",")]
    .concat(rows.map((r) => headers.map((h) => csvEscape((r as any)[h])).join(",")))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=workouts.csv",
    },
  });
}
