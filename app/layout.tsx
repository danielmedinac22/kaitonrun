import type { Metadata } from "next";
import Link from "next/link";
import "../src/app/globals.css";

export const metadata: Metadata = {
  title: "KaitonRun",
  description: "Training log (Daniel)",
};

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
    >
      {label}
    </Link>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <div className="min-h-screen">
          <div className="mx-auto max-w-5xl px-4 py-6">
            <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-medium text-indigo-600">KaitonRun</div>
                <h1 className="text-2xl font-semibold tracking-tight">Entrenamiento</h1>
                <p className="mt-1 text-sm text-slate-500">Mar/Jue/Dom · objetivo media maratón</p>
              </div>

              <nav className="flex flex-wrap items-center gap-2">
                <NavLink href="/" label="Semana" />
                <NavLink href="/history" label="Historial" />
                <Link
                  href="/log"
                  className="ml-1 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
                >
                  Registrar
                </Link>
              </nav>
            </header>

            {children}

            <footer className="mt-10 border-t border-slate-200 pt-6 text-xs text-slate-500">
              MVP v0 · Próximo: persistencia en GitHub + import Strava.
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
