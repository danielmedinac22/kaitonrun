"use client";

import { useState } from "react";
import { Heart, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ZonesCard() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [age, setAge] = useState("");
  const [restingHR, setRestingHR] = useState("");
  const [maxHR, setMaxHR] = useState("");

  async function calculateZones() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "zones",
          age: age || undefined,
          restingHR: restingHR || undefined,
          maxHR: maxHR || undefined,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage(data.message);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch {
      setMessage("Error de conexión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-rose-100">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
            <Heart className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base">Zonas de entrenamiento</CardTitle>
            <CardDescription>IA calcula tus zonas de FC, ritmo y umbrales.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-3 gap-3">
          <label className="grid gap-1 text-xs font-medium text-slate-600">
            Edad
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="ej. 30"
              className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700"
            />
          </label>
          <label className="grid gap-1 text-xs font-medium text-slate-600">
            FC reposo
            <input
              type="number"
              value={restingHR}
              onChange={(e) => setRestingHR(e.target.value)}
              placeholder="ej. 55"
              className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700"
            />
          </label>
          <label className="grid gap-1 text-xs font-medium text-slate-600">
            FC máxima
            <input
              type="number"
              value={maxHR}
              onChange={(e) => setMaxHR(e.target.value)}
              placeholder="ej. 190"
              className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700"
            />
          </label>
        </div>
        <p className="mb-3 text-xs text-slate-400">
          Los campos son opcionales. La IA estimará basándose en tus datos de Strava y RPE.
        </p>
        <Button
          onClick={calculateZones}
          disabled={loading}
          size="sm"
          className="gap-1.5 bg-rose-600 hover:bg-rose-700"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Calculando zonas...
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              Calcular mis zonas
            </>
          )}
        </Button>

        {message && !loading && (
          <div className="mt-4 rounded-lg border border-rose-100 bg-white p-4">
            <div className="prose prose-sm prose-slate max-w-none text-sm text-slate-700 [&>ul]:space-y-1 [&>ol]:space-y-1 [&_strong]:text-slate-900 [&_table]:text-xs [&_th]:px-2 [&_td]:px-2">
              {message.split("\n").map((line, i) => {
                if (!line.trim()) return <br key={i} />;
                const formatted = line.replace(
                  /\*\*(.*?)\*\*/g,
                  "<strong>$1</strong>"
                );
                return (
                  <p
                    key={i}
                    className="my-0.5"
                    dangerouslySetInnerHTML={{ __html: formatted }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
