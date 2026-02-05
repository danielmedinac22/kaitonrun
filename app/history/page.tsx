import fs from "fs";
import path from "path";

type Workout = {
  date: string;
  type: "run" | "gym" | "rest";
  minutes?: number;
  rpe?: number;
  notes?: string;
};

function readWorkouts(): Workout[] {
  const dir = path.join(process.cwd(), "data", "workouts");
  if (!fs.existsSync(dir)) return [];
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .reverse();

  const out: Workout[] = [];
  for (const f of files) {
    const p = path.join(dir, f);
    try {
      const j = JSON.parse(fs.readFileSync(p, "utf-8"));
      out.push(j);
    } catch {}
  }
  return out;
}

export default function HistoryPage() {
  const workouts = readWorkouts();

  return (
    <main className="space-y-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="text-lg font-medium">Historial</h2>
        <p className="mt-1 text-sm text-zinc-400">Últimos entrenamientos registrados.</p>
      </div>

      {workouts.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-6 text-sm text-zinc-300">
          Aún no hay entrenamientos. Ve a <a className="underline" href="/log">Registrar</a>.
        </div>
      ) : (
        <div className="space-y-3">
          {workouts.map((w) => (
            <div key={w.date} className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-zinc-400">{w.date}</div>
                  <div className="mt-1 font-medium capitalize">{w.type}</div>
                </div>
                <div className="text-right text-sm text-zinc-300">
                  {w.minutes ? <div>{w.minutes} min</div> : null}
                  {w.rpe ? <div>RPE {w.rpe}/10</div> : null}
                </div>
              </div>
              {w.notes ? <div className="mt-3 text-sm text-zinc-300">{w.notes}</div> : null}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
