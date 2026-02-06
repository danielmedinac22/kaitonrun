"use client";

import { useMemo, useState } from "react";
import { Activity, Dumbbell, Moon, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Workout } from "@/lib/workouts";

function typeIcon(type: string) {
  if (type === "run") return <Activity className="h-4 w-4 text-indigo-500" />;
  if (type === "gym") return <Dumbbell className="h-4 w-4 text-emerald-500" />;
  return <Moon className="h-4 w-4 text-slate-400" />;
}

function typeLabel(type: string) {
  if (type === "run") return "Correr";
  if (type === "gym") return "Fortalecimiento";
  return "Descanso";
}

function typeBorderColor(type: string) {
  if (type === "run") return "border-l-indigo-400";
  if (type === "gym") return "border-l-emerald-400";
  return "border-l-slate-300";
}

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

  const typeButtons: { key: string; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "run", label: "Correr" },
    { key: "gym", label: "Gym" },
    { key: "rest", label: "Descanso" },
  ];

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {typeButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => setType(btn.key)}
              className={
                "rounded-lg border px-3 py-1.5 text-sm font-medium transition-all " +
                (type === btn.key
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300")
              }
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-600">Min (min)</span>
            <input
              value={minMinutes}
              onChange={(e) => setMinMinutes(e.target.value)}
              inputMode="numeric"
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-slate-900 transition-colors"
              placeholder="30"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-600">Max (min)</span>
            <input
              value={maxMinutes}
              onChange={(e) => setMaxMinutes(e.target.value)}
              inputMode="numeric"
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-slate-900 transition-colors"
              placeholder="90"
            />
          </label>
          <div className="col-span-2 flex items-end md:col-span-2">
            <div className="text-sm text-slate-500">
              <span className="font-semibold text-slate-700">{filtered.length}</span> resultados
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="stagger-children space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <Search className="h-8 w-8 text-slate-300" />
            <div>
              <div className="font-medium text-slate-700">Sin resultados</div>
              <div className="mt-1 text-sm text-slate-500">No hay entrenamientos con esos filtros.</div>
            </div>
          </div>
        ) : (
          filtered.map((w) => (
            <div
              key={w.date}
              className={
                "rounded-xl border border-l-4 bg-white p-4 shadow-sm transition-shadow hover:shadow-md " +
                typeBorderColor(w.type)
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div className="mt-0.5">{typeIcon(w.type)}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{typeLabel(w.type)}</span>
                      <Badge variant={w.type === "run" ? "planned" : w.type === "gym" ? "done" : "default"}>
                        {w.type}
                      </Badge>
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">{w.date}</div>
                    {w.notes && <div className="mt-2 text-sm leading-relaxed text-slate-600">{w.notes}</div>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                  {w.minutes ? (
                    <div className="text-sm font-semibold text-slate-900">{w.minutes} min</div>
                  ) : null}
                  {w.rpe ? (
                    <div className="text-xs text-slate-500">RPE {w.rpe}/10</div>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
