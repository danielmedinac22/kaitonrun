"use client";

import { useState, useRef, useEffect } from "react";
import { Brain, Send, Loader2, Wrench, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type Message = {
  role: "user" | "assistant";
  content: string;
  toolsUsed?: string[];
};

const QUICK_ACTIONS = [
  { id: "plan_next_15", label: "Planear 15 días", prompt: "Planifica mis próximos 15 días de entrenamiento. Revisa mi historial reciente, mi fase actual y ajusta el plan con entrenamientos específicos. Modifica el plan directamente." },
  { id: "analyze_last", label: "Analizar último entreno", prompt: "Analiza mi último entrenamiento. ¿Cómo estuvo? ¿Cumplí el plan? ¿Qué debo ajustar?" },
  { id: "calculate_zones", label: "Calcular mis zonas", prompt: "Calcula mis zonas de entrenamiento basándote en mis últimos 90 días de datos de Strava. Guárdalas en mi perfil." },
  { id: "weekly_review", label: "Revisión semanal", prompt: "Dame una revisión completa de mi semana: cumplimiento, carga, tendencia, y qué ajustar para la próxima semana." },
  { id: "adjust_week", label: "Ajustar esta semana", prompt: "Basándote en cómo me ha ido, ajusta los entrenamientos restantes de esta semana. Modifica el plan directamente." },
  { id: "race_readiness", label: "¿Cómo voy para la carrera?", prompt: "Evalúa mi preparación para la media maratón. ¿Voy bien? ¿En cuánto tiempo debería correr los 5K y 10K según mi nivel actual? ¿Qué me falta?" },
];

const TOOL_LABELS: Record<string, string> = {
  get_recent_workouts: "Consultando historial",
  get_upcoming_plan: "Revisando plan",
  calculate_and_save_zones: "Calculando zonas",
  modify_plan: "Modificando plan",
  update_athlete_goals: "Actualizando objetivos",
  save_coach_notes: "Guardando notas",
};

function formatMessage(content: string) {
  return content.split("\n").map((line, i) => {
    if (!line.trim()) return <br key={i} />;
    // Bold
    let html = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // Bullet points
    if (html.startsWith("- ") || html.startsWith("• ")) {
      html = `<span class="ml-2">•</span> ${html.slice(2)}`;
      return <p key={i} className="my-0.5 flex gap-1" dangerouslySetInnerHTML={{ __html: html }} />;
    }
    return <p key={i} className="my-0.5" dangerouslySetInnerHTML={{ __html: html }} />;
  });
}

export default function CoachChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setCurrentTools] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setCurrentTools([]);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();

      if (data.ok) {
        setMessages([
          ...newMessages,
          { role: "assistant", content: data.reply, toolsUsed: data.toolsUsed },
        ]);
      } else {
        setMessages([
          ...newMessages,
          { role: "assistant", content: `Error: ${data.error}` },
        ]);
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Error de conexión con el coach." },
      ]);
    } finally {
      setLoading(false);
      setCurrentTools([]);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const isEmptyChat = messages.length === 0;

  return (
    <div className="flex flex-col rounded-xl border border-purple-100 bg-gradient-to-b from-white to-purple-50/30 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-purple-100 px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
          <Brain className="h-4.5 w-4.5" />
        </span>
        <div className="flex-1">
          <div className="text-sm font-semibold text-slate-900">KaitonCoach</div>
          <div className="text-[11px] text-slate-400">Entrenador personal con IA &middot; GPT-4o</div>
        </div>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
          Online
        </span>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ maxHeight: "28rem", minHeight: "10rem" }}>
        {isEmptyChat && (
          <div className="space-y-4">
            <div className="rounded-lg bg-purple-50 p-3 text-sm text-purple-800">
              <p className="font-medium">Hola, soy tu coach. Puedo:</p>
              <ul className="mt-1.5 space-y-1 text-purple-700">
                <li>• Planificar y <strong>modificar</strong> tus entrenamientos</li>
                <li>• Calcular y <strong>guardar</strong> tus zonas de FC y ritmo</li>
                <li>• Analizar tu rendimiento y detectar sobreentrenamiento</li>
                <li>• Estimar tus tiempos de carrera (5K, 10K, media)</li>
                <li>• Ajustar el plan según cómo te sientes</li>
              </ul>
              <p className="mt-2 text-xs text-purple-500">Pregúntame lo que quieras o usa las acciones rápidas.</p>
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-1.5">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => sendMessage(a.prompt)}
                  disabled={loading}
                  className="rounded-lg border border-purple-200 bg-white px-2.5 py-1.5 text-xs font-medium text-purple-700 transition-all hover:border-purple-300 hover:bg-purple-50 active:scale-95 disabled:opacity-50"
                >
                  <Sparkles className="mr-1 inline h-3 w-3" />
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`mb-3 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                m.role === "user"
                  ? "rounded-br-md bg-indigo-600 text-white"
                  : "rounded-bl-md border border-purple-100 bg-white text-slate-700"
              }`}
            >
              {m.role === "assistant" ? (
                <div className="prose prose-sm prose-slate max-w-none [&_strong]:text-slate-900">
                  {formatMessage(m.content)}
                </div>
              ) : (
                <div>{m.content}</div>
              )}
              {m.toolsUsed && m.toolsUsed.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1 border-t border-purple-50 pt-1.5">
                  {[...new Set(m.toolsUsed)].map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-0.5 rounded-full bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-600"
                    >
                      <Wrench className="h-2.5 w-2.5" />
                      {TOOL_LABELS[t] || t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="mb-3 flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-purple-100 bg-white px-3.5 py-2.5 text-sm text-purple-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Pensando...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions after conversation started */}
      {!isEmptyChat && !loading && (
        <div className="flex flex-wrap gap-1 border-t border-purple-50 px-4 py-2">
          {QUICK_ACTIONS.slice(0, 4).map((a) => (
            <button
              key={a.id}
              onClick={() => sendMessage(a.prompt)}
              disabled={loading}
              className="rounded-md border border-purple-100 bg-white px-2 py-1 text-[10px] font-medium text-purple-600 transition-all hover:bg-purple-50 active:scale-95 disabled:opacity-50"
            >
              {a.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-purple-100 p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Habla con tu coach..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100"
            style={{ minHeight: "2.5rem", maxHeight: "6rem" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 96) + "px";
            }}
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            size="icon"
            className="h-10 w-10 shrink-0 rounded-xl bg-purple-600 hover:bg-purple-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
