"use client";

import { useState } from "react";
import { RefreshCw, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type SyncResult = {
  ok: boolean;
  total?: number;
  synced?: number;
  skipped?: number;
  error?: string;
};

export default function StravaClient({
  isConnected,
  athleteName,
}: {
  isConnected: boolean;
  athleteName: string;
}) {
  const [days, setDays] = useState("7");
  const [status, setStatus] = useState<"idle" | "syncing" | "done" | "error">("idle");
  const [result, setResult] = useState<SyncResult | null>(null);

  async function handleSync() {
    setStatus("syncing");
    setResult(null);

    try {
      const res = await fetch("/api/strava/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: Number(days) }),
      });
      const data: SyncResult = await res.json();
      setResult(data);
      setStatus(data.ok ? "done" : "error");
    } catch {
      setResult({ ok: false, error: "Error de red" });
      setStatus("error");
    }
  }

  if (!isConnected) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Conecta tu cuenta de Strava para importar actividades automaticamente.
        </p>
        <Button asChild>
          <a href="/api/strava/authorize">
            Conectar con Strava
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600">
          <Check className="h-5 w-5" />
        </div>
        <div>
          <div className="font-medium text-slate-900">Conectado</div>
          <div className="text-sm text-slate-500">{athleteName || "Atleta de Strava"}</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-slate-700">Días a sincronizar</span>
            <div className="flex gap-2">
              {["7", "14", "30"].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={
                    "rounded-lg border px-3 py-1.5 text-sm font-medium transition-all " +
                    (days === d
                      ? "border-orange-300 bg-orange-50 text-orange-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300")
                  }
                >
                  {d}d
                </button>
              ))}
            </div>
          </label>

          <Button onClick={handleSync} disabled={status === "syncing"}>
            {status === "syncing" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Sincronizar
              </>
            )}
          </Button>
        </div>

        {result && status === "done" && (
          <div className="animate-fade-in flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
            <Check className="mt-0.5 h-4 w-4 text-emerald-600" />
            <div>
              <div className="font-medium text-emerald-800">Sincronización completada</div>
              <div className="text-emerald-700">
                {result.total} actividades encontradas · {result.synced} sincronizadas
                {result.skipped ? ` · ${result.skipped} omitidas` : ""}
              </div>
            </div>
          </div>
        )}

        {result && status === "error" && (
          <div className="animate-fade-in flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 text-red-600" />
            <div>
              <div className="font-medium text-red-800">Error</div>
              <div className="text-red-700">{result.error}</div>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-500">
        La sincronización importa actividades de Strava como entrenamientos.
        Las actividades de tipo Run se importan como &quot;Correr&quot;, las de
        WeightTraining como &quot;Gym&quot;. Si ya existe un registro para esa fecha, se reemplaza.
      </div>
    </div>
  );
}
