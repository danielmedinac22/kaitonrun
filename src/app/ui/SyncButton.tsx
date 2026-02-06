"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SyncButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ synced: number } | null>(null);

  async function handleSync() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/strava/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: 7, runsOnly: true }),
      });
      const data = await res.json();
      if (data.ok) {
        setResult({ synced: data.synced });
        // Reload to reflect new data
        if (data.synced > 0) {
          setTimeout(() => window.location.reload(), 1200);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={handleSync}
        disabled={loading}
        className="gap-1.5"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Sincronizando..." : "Sync Strava"}
      </Button>
      {result && !loading && (
        <span className="text-xs text-slate-500">
          {result.synced > 0
            ? `${result.synced} carrera${result.synced > 1 ? "s" : ""} sincronizada${result.synced > 1 ? "s" : ""}`
            : "Todo al día"}
        </span>
      )}
    </div>
  );
}
