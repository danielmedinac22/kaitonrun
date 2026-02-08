"use client";

import { useMemo, useState } from "react";
import { Activity, Dumbbell, Moon, Loader2, Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type WorkoutType = "run" | "gym" | "rest";

const typeOptions: { key: WorkoutType; label: string; icon: React.ReactNode }[] = [
  { key: "run", label: "Correr", icon: <Activity className="h-4 w-4" /> },
  { key: "gym", label: "Gym", icon: <Dumbbell className="h-4 w-4" /> },
  { key: "rest", label: "Descanso", icon: <Moon className="h-4 w-4" /> },
];

export default function QuickMarkDialog({
  date,
  defaultType,
  triggerText,
}: {
  date: string;
  defaultType: WorkoutType;
  triggerText: string;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [type, setType] = useState<WorkoutType>(defaultType);
  const [minutes, setMinutes] = useState<string>(defaultType === "rest" ? "0" : "");
  const [rpe, setRpe] = useState<string>(defaultType === "rest" ? "" : "");
  const [notes, setNotes] = useState<string>("");

  const canSave = useMemo(() => {
    if (!date) return false;
    if (type === "rest") return true;
    return minutes.trim().length > 0;
  }, [date, type, minutes]);

  async function save() {
    setSaving(true);
    setStatus("saving");
    try {
      const payload: Record<string, string> = { date, type };
      if (minutes) payload.minutes = minutes;
      if (rpe) payload.rpe = rpe;
      if (notes) payload.notes = notes;

      const res = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "No se pudo guardar");

      setStatus("success");
      setTimeout(() => {
        setOpen(false);
        window.location.reload();
      }, 600);
    } catch (e: unknown) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="default">
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marcar como hecho</DialogTitle>
          <DialogDescription>
            Registra el entrenamiento del {date}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Type selection */}
          <div className="grid gap-2">
            <Label>Tipo</Label>
            <div className="grid grid-cols-3 gap-2">
              {typeOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setType(opt.key)}
                  className={
                    "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all " +
                    (type === opt.key
                      ? "border-primary/40 bg-primary-soft text-primary shadow-sm"
                      : "border-border bg-surface text-txt-secondary hover:border-border hover:bg-surface-elevated")
                  }
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Minutos</Label>
              <Input
                inputMode="numeric"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder={type === "rest" ? "0" : "45"}
              />
            </div>
            <div className="grid gap-2">
              <Label>RPE (1–10)</Label>
              <Input
                inputMode="numeric"
                value={rpe}
                onChange={(e) => setRpe(e.target.value)}
                placeholder={type === "rest" ? "" : "6"}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Notas</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Sensaciones, molestias, energía..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            {status === "success" ? (
              <div className="animate-fade-in flex items-center gap-1.5 text-sm font-medium text-success">
                <Check className="h-4 w-4" />
                Guardado
              </div>
            ) : status === "error" ? (
              <div className="animate-fade-in text-sm font-medium text-danger">{errorMsg}</div>
            ) : (
              <div />
            )}
            <Button disabled={!canSave || saving} onClick={save}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
