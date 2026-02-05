import { startOfWeek, addDays, format } from "date-fns";

function dowLabel(d: Date) {
  return format(d, "EEE d MMM");
}

export default async function Home() {
  const base = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
  const days = Array.from({ length: 7 }).map((_, i) => addDays(base, i));

  return (
    <main className="space-y-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="text-sm text-zinc-400">Semana actual</div>
        <div className="mt-1 text-lg font-medium">Mar/Jue/Dom — objetivo media maratón</div>
        <div className="mt-2 text-sm text-zinc-400">
          MVP: registra duración, RPE y notas. (Luego conectamos Strava/Apple Health.)
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {days.map((d) => (
          <div key={d.toISOString()} className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-zinc-400">{dowLabel(d)}</div>
                <div className="mt-1 font-medium">Plan del día</div>
              </div>
              <span className="rounded-full border border-zinc-700 px-2 py-1 text-xs text-zinc-300">
                Pendiente
              </span>
            </div>
            <div className="mt-3 text-sm text-zinc-300">
              <ul className="list-disc space-y-1 pl-5">
                <li>Run fácil (30–60 min) o largo (fin de semana)</li>
                <li>Registrar: duración + RPE + notas</li>
              </ul>
            </div>
            <div className="mt-4">
              <a
                href="/log"
                className="inline-flex items-center rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/15"
              >
                Registrar entreno
              </a>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
