import type { Metadata } from "next";
import Link from "next/link";
import "../src/app/globals.css";

export const metadata: Metadata = {
  title: "KaitonRun",
  description: "Training log (Daniel)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <header className="mb-8 flex items-center justify-between">
            <div>
              <div className="text-sm text-zinc-400">KaitonRun</div>
              <h1 className="text-2xl font-semibold tracking-tight">Training Log</h1>
            </div>
            <nav className="flex gap-3 text-sm">
              <Link className="text-zinc-300 hover:text-white" href="/">Semana</Link>
              <Link className="text-zinc-300 hover:text-white" href="/history">Historial</Link>
              <Link className="rounded-md bg-zinc-800 px-3 py-1.5 text-zinc-100 hover:bg-zinc-700" href="/log">Registrar</Link>
            </nav>
          </header>
          {children}
          <footer className="mt-10 text-xs text-zinc-500">
            Datos guardados en Git (data/workouts). MVP v0.
          </footer>
        </div>
      </body>
    </html>
  );
}
