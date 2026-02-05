import LogForm from "./ui/LogForm";

export const dynamic = "force-dynamic";

export default function LogPage() {
  return (
    <main className="space-y-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="text-lg font-medium">Registrar entrenamiento</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Guarda un JSON en <code className="text-zinc-200">data/workouts</code>. En la siguiente iteración lo conectamos a GitHub API desde la UI.
        </p>
      </div>
      <LogForm />
    </main>
  );
}
