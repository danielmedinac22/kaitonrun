"use client";

import { useState } from "react";
import { RefreshCw, History } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SyncButton() {
  const [loading, setLoading] = useState(false);
  const [syncType, setSyncType] = useState<"quick" | "full" | null>(null);
  const [result, setResult] = useState<{ synced: number; total: number } | null>(null);

  async function handleSync(days: number) {
    const type = days > 30 ? "full" : "quick";
    setLoading(true);
    setSyncType(type);
    setResult(null);
    try {
      const res = await fetch("/api/strava/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days, runsOnly: false }),
      });
      const data = await res.json();
      if (data.ok) {
        setResult({ synced: data.synced, total: data.total });
        if (data.synced > 0) {
          setTimeout(() => window.location.reload(), 1500);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setSyncType(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleSync(7)}
          disabled={loading}
          className="gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading && syncType === "quick" ? "animate-spin" : ""}`} />
          {loading && syncType === "quick" ? "Sincronizando..." : "Sync reciente"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSync(365)}
          disabled={loading}
          className="gap-1.5"
        >
          <History className={`h-3.5 w-3.5 ${loading && syncType === "full" ? "animate-spin" : ""}`} />
          {loading && syncType === "full" ? "Importando historial..." : "Importar 365 días"}
        </Button>
      </div>
      {result && !loading && (
        <span className="text-xs text-txt-secondary">
          {result.synced > 0
            ? `${result.synced} actividad${result.synced > 1 ? "es" : ""} sincronizada${result.synced > 1 ? "s" : ""} (${result.total} encontrada${result.total > 1 ? "s" : ""} en Strava)`
            : "Todo al día"}
        </span>
      )}
    </div>
  );
}
