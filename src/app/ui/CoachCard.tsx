"use client";

import { useState } from "react";
import { Brain, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type CoachAction = "analyze" | "briefing" | "adjust";

export default function CoachCard({
  date,
  hasWorkout,
}: {
  date: string;
  hasWorkout: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<CoachAction | null>(null);

  async function askCoach(action: CoachAction) {
    setLoading(true);
    setMessage(null);
    setActiveAction(action);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, date }),
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
    <Card className="border-purple-100 bg-gradient-to-br from-white via-white to-purple-50/60">
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
            <Brain className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold text-slate-900">KaitonCoach</span>
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-600">IA</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {hasWorkout ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => askCoach("analyze")}
              disabled={loading}
              className="gap-1.5 border-purple-200 hover:bg-purple-50"
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-500" />
              Analizar entrenamiento
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => askCoach("briefing")}
              disabled={loading}
              className="gap-1.5 border-purple-200 hover:bg-purple-50"
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-500" />
              Briefing pre-entreno
            </Button>
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => askCoach("adjust")}
            disabled={loading}
            className="gap-1.5 border-purple-200 hover:bg-purple-50"
          >
            <RefreshCw className="h-3.5 w-3.5 text-purple-500" />
            Ajustar plan
          </Button>
        </div>

        {loading && (
          <div className="mt-3 flex items-center gap-2 text-sm text-purple-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            {activeAction === "analyze"
              ? "Analizando tu entrenamiento..."
              : activeAction === "briefing"
                ? "Preparando tu briefing..."
                : "Evaluando ajustes..."}
          </div>
        )}

        {message && !loading && (
          <div className="mt-3 rounded-lg border border-purple-100 bg-white p-3">
            <div className="prose prose-sm prose-slate max-w-none text-sm text-slate-700 [&>ul]:space-y-1 [&>ol]:space-y-1 [&_strong]:text-slate-900">
              {message.split("\n").map((line, i) => {
                if (!line.trim()) return <br key={i} />;
                // Bold text
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
