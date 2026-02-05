"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type WorkoutType = "run" | "gym" | "rest";

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
  const [status, setStatus] = useState<string>("");

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
    setStatus("Guardando...");
    try {
      const payload: any = { date, type };
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

      setStatus("Listo. Guardado.");
      // close and refresh
      setTimeout(() => {
        setOpen(false);
        window.location.reload();
      }, 350);
    } catch (e: any) {
      setStatus(e?.message || "Error");
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
            Guarda el entrenamiento de hoy (queda versionado en GitHub).
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Tipo</Label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { k: "run", t: "Run" },
                { k: "gym", t: "Gym" },
                { k: "rest", t: "Rest" },
              ] as const).map((x) => (
                <button
                  key={x.k}
                  type="button"
                  onClick={() => setType(x.k)}
                  className={
                    "h-10 rounded-md border px-3 text-sm font-medium " +
                    (type === x.k
                      ? "border-indigo-200 bg-indigo-50 text-indigo-800"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50")
                  }
                >
                  {x.t}
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
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">{status}</div>
            <Button disabled={!canSave || saving} onClick={save}>
              Guardar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
