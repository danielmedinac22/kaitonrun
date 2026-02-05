import { addDays, format, startOfWeek } from "date-fns";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { readWorkouts, workoutByDate } from "@/lib/workouts";

function dowShort(d: Date) {
  return format(d, "EEE");
}

function dateKey(d: Date) {
  return format(d, "yyyy-MM-dd");
}

const plannedDow = new Set([2, 4, 0]); // Tue Thu Sun

export default function WeekPage() {
  const base = startOfWeek(new Date(), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }).map((_, i) => addDays(base, i));

  const workouts = readWorkouts();
  const byDate = workoutByDate(workouts);

  return (
    <main className="space-y-4">
      <Card>
        <CardHeader
          title="Semana actual"
          subtitle="Plan simple: 2 sesiones cortas (semana) + 1 largo (domingo)."
          right={<Button asLinkHref="/log" variant="primary">Registrar</Button>}
        />
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {days.map((d) => {
              const key = dateKey(d);
              const w = byDate.get(key);
              const dow = d.getDay();
              const isPlanned = plannedDow.has(dow);

              const status = w ? "done" : isPlanned ? "pending" : "moved";
              const badge =
                status === "done"
                  ? { v: "done" as const, t: "Hecho" }
                  : status === "pending"
                    ? { v: "pending" as const, t: "Pendiente" }
                    : { v: "moved" as const, t: "Libre" };

              return (
                <div key={key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-slate-500">{dowShort(d).toUpperCase()}</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">{format(d, "d MMM")}</div>
                    </div>
                    <Badge variant={badge.v}>{badge.t}</Badge>
                  </div>

                  <div className="mt-3 text-sm text-slate-700">
                    {w ? (
                      <div className="space-y-1">
                        <div className="font-medium capitalize">{w.type}</div>
                        <div className="text-slate-500">
                          {w.minutes ? `${w.minutes} min` : ""} {w.rpe ? `· RPE ${w.rpe}/10` : ""}
                        </div>
                      </div>
                    ) : isPlanned ? (
                      <ul className="list-disc space-y-1 pl-5 text-slate-600">
                        <li>30–60 min</li>
                        <li>RPE 3–7 según sesión</li>
                      </ul>
                    ) : (
                      <div className="text-slate-500">Descanso o fuerza.</div>
                    )}
                  </div>

                  <div className="mt-4">
                    <Button asLinkHref={`/log?date=${key}`} variant={w ? "secondary" : "primary"}>
                      {w ? "Editar" : "Registrar"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader title="Hoy" subtitle="Check rápido" />
          <CardBody>
            <div className="text-sm text-slate-700">
              Después de entrenar: envíame por Telegram <span className="font-semibold">minutos + RPE + notas</span>.
              (Luego lo automatizamos con Strava.)
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Reglas" subtitle="Para progresar sin lesionarnos" />
          <CardBody>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
              <li>Semana 1–4: prioridad consistencia (no velocidad).</li>
              <li>Si aparece dolor que cambia tu zancada: paramos y ajustamos.</li>
              <li>Subida de carga: máx +10–15% semanal.</li>
            </ul>
          </CardBody>
        </Card>
      </div>
    </main>
  );
}
