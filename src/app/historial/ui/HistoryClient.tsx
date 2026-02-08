"use client";

import { useMemo, useState } from "react";
import { Search, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { typeLabel, typeIcon, typeBorderColor } from "@/lib/labels";
import type { Workout } from "@/lib/workouts";

export default function HistoryClient({ workouts }: { workouts: Workout[] }) {
  const [type, setType] = useState<string>("all");
  const [minMinutes, setMinMinutes] = useState<string>("");
  const [maxMinutes, setMaxMinutes] = useState<string>("");
  const [minRpe, setMinRpe] = useState<string>("");
  const [maxRpe, setMaxRpe] = useState<string>("");
  const [source, setSource] = useState<string>("all");

  const filtered = useMemo(() => {
    const min = minMinutes ? Number(minMinutes) : undefined;
    const max = maxMinutes ? Number(maxMinutes) : undefined;
    const rMin = minRpe ? Number(minRpe) : undefined;
    const rMax = maxRpe ? Number(maxRpe) : undefined;

    return workouts.filter((w) => {
      if (type !== "all" && w.type !== type) return false;
      if (min !== undefined && (w.minutes ?? 0) < min) return false;
      if (max !== undefined && (w.minutes ?? 0) > max) return false;
      if (rMin !== undefined && (w.rpe ?? 0) < rMin) return false;
      if (rMax !== undefined && (w.rpe ?? 0) > rMax) return false;
      if (source !== "all" && (w.source ?? "manual") !== source) return false;
      return true;
    });
  }, [workouts, type, minMinutes, maxMinutes, minRpe, maxRpe, source]);

  const typeButtons: { key: string; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "run", label: "Correr" },
    { key: "gym", label: "Gym" },
    { key: "rest", label: "Descanso" },
  ];

  const sourceButtons: { key: string; label: string }[] = [
    { key: "all", label: "Todas" },
    { key: "manual", label: "Manual" },
    { key: "strava", label: "Strava" },
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
                  ? "border-primary/40 bg-primary-soft text-primary"
                  : "border-border bg-surface text-txt-secondary hover:border-border")
              }
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {sourceButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => setSource(btn.key)}
              className={
                "rounded-lg border px-2.5 py-1 text-xs font-medium transition-all " +
                (source === btn.key
                  ? "border-primary/40 bg-primary-soft text-primary"
                  : "border-border bg-surface text-txt-secondary hover:border-border")
              }
            >
              {btn.key === "strava" && <Zap className="mr-1 inline h-3 w-3" />}
              {btn.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-txt-secondary">Min (min)</span>
            <input
              value={minMinutes}
              onChange={(e) => setMinMinutes(e.target.value)}
              inputMode="numeric"
              className="h-9 rounded-lg border border-border bg-surface px-3 text-txt-primary transition-colors"
              placeholder="30"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-txt-secondary">Max (min)</span>
            <input
              value={maxMinutes}
              onChange={(e) => setMaxMinutes(e.target.value)}
              inputMode="numeric"
              className="h-9 rounded-lg border border-border bg-surface px-3 text-txt-primary transition-colors"
              placeholder="90"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-txt-secondary">RPE min</span>
            <input
              value={minRpe}
              onChange={(e) => setMinRpe(e.target.value)}
              inputMode="numeric"
              className="h-9 rounded-lg border border-border bg-surface px-3 text-txt-primary transition-colors"
              placeholder="1"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-txt-secondary">RPE max</span>
            <input
              value={maxRpe}
              onChange={(e) => setMaxRpe(e.target.value)}
              inputMode="numeric"
              className="h-9 rounded-lg border border-border bg-surface px-3 text-txt-primary transition-colors"
              placeholder="10"
            />
          </label>
          <div className="flex items-end">
            <div className="text-sm text-txt-secondary">
              <span className="font-semibold text-txt-primary">{filtered.length}</span> resultados
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="stagger-children space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface p-10 text-center">
            <Search className="h-8 w-8 text-txt-muted" />
            <div>
              <div className="font-medium text-txt-primary">Sin resultados</div>
              <div className="mt-1 text-sm text-txt-secondary">No hay entrenamientos con esos filtros.</div>
            </div>
          </div>
        ) : (
          filtered.map((w) => (
            <div
              key={w.date}
              className={
                "rounded-xl border border-l-4 bg-surface p-4 shadow-sm transition-shadow hover:shadow-md " +
                typeBorderColor(w.type)
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div className="mt-0.5">{typeIcon(w.type)}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-txt-primary">{typeLabel(w.type)}</span>
                      <Badge variant={w.type === "run" ? "planned" : w.type === "gym" ? "done" : "default"}>
                        {w.type}
                      </Badge>
                      {w.source === "strava" && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-primary-soft px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                          <Zap className="h-2.5 w-2.5" />
                          Strava
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-txt-secondary">{w.date}</div>
                    {w.notes && <div className="mt-2 text-sm leading-relaxed text-txt-secondary">{w.notes}</div>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                  {w.minutes ? (
                    <div className="text-sm font-semibold text-txt-primary">{w.minutes} min</div>
                  ) : null}
                  {w.rpe ? (
                    <div className="text-xs text-txt-secondary">RPE {w.rpe}/10</div>
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
