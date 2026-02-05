"use client";

import { useMemo, useState } from "react";
import type { Workout } from "@/lib/workouts";

export default function HistoryClient({ workouts }: { workouts: Workout[] }) {
  const [type, setType] = useState<string>("all");
  const [minMinutes, setMinMinutes] = useState<string>("");
  const [maxMinutes, setMaxMinutes] = useState<string>("");

  const filtered = useMemo(() => {
    const min = minMinutes ? Number(minMinutes) : undefined;
    const max = maxMinutes ? Number(maxMinutes) : undefined;

    return workouts.filter((w) => {
      if (type !== "all" && w.type !== type) return false;
      if (min !== undefined && (w.minutes ?? 0) < min) return false;
      if (max !== undefined && (w.minutes ?? 0) > max) return false;
      return true;
    });
  }, [workouts, type, minMinutes, maxMinutes]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600">Tipo</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2"
          >
            <option value="all">Todos</option>
            <option value="run">Run</option>
            <option value="gym">Gym</option>
            <option value="rest">Rest</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600">Min (min)</span>
          <input
            value={minMinutes}
            onChange={(e) => setMinMinutes(e.target.value)}
            inputMode="numeric"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2"
            placeholder="30"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600">Max (min)</span>
          <input
            value={maxMinutes}
            onChange={(e) => setMaxMinutes(e.target.value)}
            inputMode="numeric"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2"
            placeholder="90"
          />
        </label>
        <div className="flex items-end">
          <div className="text-sm text-slate-500">{filtered.length} resultados</div>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            No hay entrenamientos con esos filtros.
          </div>
        ) : (
          filtered.map((w) => (
            <div key={w.date} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-slate-500">{w.date}</div>
                  <div className="mt-1 font-semibold capitalize text-slate-900">{w.type}</div>
                  {w.notes ? <div className="mt-2 text-sm text-slate-700">{w.notes}</div> : null}
                </div>
                <div className="text-right text-sm text-slate-700">
                  {w.minutes ? <div>{w.minutes} min</div> : null}
                  {w.rpe ? <div className="text-slate-500">RPE {w.rpe}/10</div> : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
