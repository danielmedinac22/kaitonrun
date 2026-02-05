"use client";

import { useState } from "react";

export default function LogForm() {
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
    if (res.ok) {
      setStatus("Listo. Quedó guardado.");
      e.currentTarget.reset();
    } else {
      const t = await res.text();
      setStatus("Error: " + t);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="text-zinc-300">Fecha</span>
          <input
            name="date"
            defaultValue={today}
            className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-zinc-300">Tipo</span>
          <select name="type" className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100">
            <option value="run">Run</option>
            <option value="gym">Gym</option>
            <option value="rest">Rest</option>
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-zinc-300">Duración (min)</span>
          <input
            name="minutes"
            type="number"
            min={0}
            placeholder="45"
            className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-zinc-300">RPE (1–10)</span>
          <input
            name="rpe"
            type="number"
            min={1}
            max={10}
            placeholder="6"
            className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100"
          />
        </label>
      </div>

      <label className="mt-4 grid gap-1 text-sm">
        <span className="text-zinc-300">Notas</span>
        <textarea
          name="notes"
          rows={4}
          placeholder="Cómo te sentiste, molestias, energía, etc."
          className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100"
        />
      </label>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="submit"
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-zinc-200"
        >
          Guardar
        </button>
        <div className="text-sm text-zinc-400">{status}</div>
      </div>

      <p className="mt-4 text-xs text-zinc-500">
        Nota: este MVP guarda en el servidor (Vercel) cuando esté desplegado. En la próxima iteración lo hacemos persistente en GitHub (commits) para que quede sincronizado.
      </p>
    </form>
  );
}
