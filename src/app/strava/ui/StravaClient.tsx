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
        <p className="text-sm text-txt-secondary">
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
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Check className="h-5 w-5" />
        </div>
        <div>
          <div className="font-medium text-txt-primary">Conectado</div>
          <div className="text-sm text-txt-secondary">{athleteName || "Atleta de Strava"}</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-txt-primary">Días a sincronizar</span>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "7", label: "7d" },
                { value: "14", label: "14d" },
                { value: "30", label: "30d" },
                { value: "90", label: "90d" },
                { value: "180", label: "6m" },
                { value: "365", label: "1 año" },
              ].map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDays(d.value)}
                  className={
                    "rounded-lg border px-3 py-1.5 text-sm font-medium transition-all " +
                    (days === d.value
                      ? "border-primary/40 bg-primary-soft text-primary"
                      : "border-border bg-surface text-txt-secondary hover:border-border")
                  }
                >
                  {d.label}
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
          <div className="animate-fade-in flex items-start gap-2 rounded-lg border border-success/30 bg-success-soft p-3 text-sm">
            <Check className="mt-0.5 h-4 w-4 text-success" />
            <div>
              <div className="font-medium text-success">Sincronización completada</div>
              <div className="text-success">
                {result.total} actividades encontradas · {result.synced} sincronizadas
                {result.skipped ? ` · ${result.skipped} omitidas` : ""}
              </div>
            </div>
          </div>
        )}

        {result && status === "error" && (
          <div className="animate-fade-in flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 text-danger" />
            <div>
              <div className="font-medium text-danger">Error</div>
              <div className="text-danger">{result.error}</div>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-surface-elevated p-3 text-xs text-txt-secondary">
        La sincronización importa actividades de Strava como entrenamientos.
        Las actividades de tipo Run se importan como &quot;Correr&quot;, las de
        WeightTraining como &quot;Gym&quot;. Si ya existe un registro para esa fecha, se reemplaza.
      </div>
    </div>
  );
}
