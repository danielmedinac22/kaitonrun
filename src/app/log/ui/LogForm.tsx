"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function LogForm({ defaultDate }: { defaultDate?: string }) {
  const [status, setStatus] = useState<string>("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("Guardando...");
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    const res = await fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await res.json().catch(() => null);
    if (res.ok) {
      setStatus("Listo. Guardado.");
      e.currentTarget.reset();
    } else {
      setStatus("Error: " + (j?.error || "no se pudo guardar"));
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600">Fecha</span>
          <input
            name="date"
            defaultValue={defaultDate || today}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-600">Tipo</span>
          <select name="type" className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <option value="run">Run</option>
            <option value="gym">Gym</option>
            <option value="rest">Rest</option>
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-600">Duración (min)</span>
          <input
            name="minutes"
            type="number"
            min={0}
            placeholder="45"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-600">RPE (1–10)</span>
          <input
            name="rpe"
            type="number"
            min={1}
            max={10}
            placeholder="6"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2"
          />
        </label>
      </div>

      <label className="grid gap-1 text-sm">
        <span className="text-slate-600">Notas</span>
        <textarea
          name="notes"
          rows={5}
          placeholder="Sensaciones, molestias, energía, clima, etc."
          className="rounded-lg border border-slate-200 bg-white px-3 py-2"
        />
      </label>

      <div className="flex items-center justify-between">
        <Button type="submit" variant="default">
          Guardar
        </Button>
        <div className="text-sm text-slate-500">{status}</div>
      </div>
    </form>
  );
}
