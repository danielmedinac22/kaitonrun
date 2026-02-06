"use client";

import { useState } from "react";
import { Brain, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function WeeklyReviewCard() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function getReview() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "weekly" }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage(data.message);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch {
      setMessage("Error de conexión con el coach.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-purple-100 bg-gradient-to-br from-white via-white to-purple-50/40">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
            <Brain className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">Revisión semanal del coach</CardTitle>
            <CardDescription>Análisis de IA sobre tu semana de entrenamiento.</CardDescription>
          </div>
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-600">IA</span>
        </div>
      </CardHeader>
      <CardContent>
        {!message && !loading && (
          <Button
            onClick={getReview}
            disabled={loading}
            size="sm"
            className="gap-1.5 bg-purple-600 hover:bg-purple-700"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Generar revisión semanal
          </Button>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-purple-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Analizando tu semana con IA...
          </div>
        )}

        {message && !loading && (
          <div className="space-y-3">
            <div className="rounded-lg border border-purple-100 bg-white p-4">
              <div className="prose prose-sm prose-slate max-w-none text-sm text-slate-700 [&>ul]:space-y-1 [&>ol]:space-y-1 [&_strong]:text-slate-900">
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
            <Button
              onClick={getReview}
              disabled={loading}
              size="sm"
              variant="secondary"
              className="gap-1.5 border-purple-200"
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-500" />
              Regenerar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
