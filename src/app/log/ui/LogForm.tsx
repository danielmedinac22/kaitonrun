"use client";

import { useState } from "react";
import { Activity, Dumbbell, Moon, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type WorkoutType = "run" | "gym" | "rest";

const typeOptions: { key: WorkoutType; label: string; icon: React.ReactNode }[] = [
  { key: "run", label: "Correr", icon: <Activity className="h-4 w-4" /> },
  { key: "gym", label: "Gym", icon: <Dumbbell className="h-4 w-4" /> },
  { key: "rest", label: "Descanso", icon: <Moon className="h-4 w-4" /> },
];

export default function LogForm({ defaultDate }: { defaultDate?: string }) {
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedType, setSelectedType] = useState<WorkoutType>("run");

  const today = new Date().toISOString().slice(0, 10);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg("");
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    payload.type = selectedType;

    const res = await fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await res.json().catch(() => null);
    if (res.ok) {
      setStatus("success");
      e.currentTarget.reset();
      setTimeout(() => setStatus("idle"), 3000);
    } else {
      setStatus("error");
      setErrorMsg(j?.error || "No se pudo guardar");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Type selection */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-slate-700">Tipo de entrenamiento</span>
        <div className="grid grid-cols-3 gap-2">
          {typeOptions.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setSelectedType(opt.key)}
              className={
                "flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-medium transition-all " +
                (selectedType === opt.key
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50")
              }
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-slate-700">Fecha</span>
          <input
            name="date"
            type="date"
            defaultValue={defaultDate || today}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 transition-colors"
          />
        </label>

        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-slate-700">Duración (min)</span>
          <input
            name="minutes"
            type="number"
            min={0}
            placeholder="45"
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 transition-colors"
          />
        </label>

        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-slate-700">RPE (1–10)</span>
          <input
            name="rpe"
            type="number"
            min={1}
            max={10}
            placeholder="6"
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 transition-colors"
          />
        </label>
      </div>

      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-slate-700">Notas</span>
        <textarea
          name="notes"
          rows={4}
          placeholder="Sensaciones, molestias, energía, clima, etc."
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 transition-colors"
        />
      </label>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={status === "saving"}>
          {status === "saving" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar"
          )}
        </Button>

        {status === "success" && (
          <div className="animate-fade-in flex items-center gap-1.5 text-sm font-medium text-emerald-600">
            <Check className="h-4 w-4" />
            Guardado correctamente
          </div>
        )}

        {status === "error" && (
          <div className="animate-fade-in flex items-center gap-1.5 text-sm font-medium text-red-600">
            <AlertCircle className="h-4 w-4" />
            {errorMsg}
          </div>
        )}
      </div>
    </form>
  );
}
