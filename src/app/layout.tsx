import type { Metadata } from "next";
import Link from "next/link";
import {
  Home,
  ClipboardList,
  Plus,
  TrendingUp,
  Settings,
  PlusCircle,
} from "lucide-react";
import { NavLink, MobileNavLink } from "@/app/ui/NavLink";
import "./globals.css";

export const metadata: Metadata = {
  title: "KaitonRun",
  description: "Training log (Daniel)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <div className="min-h-screen pb-20 md:pb-0">
          <div className="mx-auto max-w-5xl px-4 py-6">
            {/* HEADER */}
            <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <Link href="/" className="group inline-flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white shadow-sm transition-transform group-hover:scale-105">
                    K
                  </span>
                  <span className="text-sm font-semibold text-slate-900">KaitonRun</span>
                </Link>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight">Entrenamiento</h1>
                <p className="mt-0.5 text-sm text-slate-500">Mar/Jue/Dom &middot; objetivo media maratón</p>
              </div>

              {/* Desktop nav */}
              <nav className="hidden flex-wrap items-center gap-1 md:flex">
                <NavLink href="/" label="Hoy" icon={<Home className="h-4 w-4" />} />
                <NavLink href="/history" label="Historial" icon={<ClipboardList className="h-4 w-4" />} />
                <NavLink href="/insights" label="Progreso" icon={<TrendingUp className="h-4 w-4" />} />
                <NavLink href="/settings" label="Ajustes" icon={<Settings className="h-4 w-4" />} />
                <Link
                  href="/log"
                  className="ml-2 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
                >
                  <PlusCircle className="h-4 w-4" />
                  Registrar
                </Link>
              </nav>
            </header>

            <div className="animate-fade-in">{children}</div>

            <footer className="mt-10 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
              KaitonRun v0.1 &middot; Training Log MVP
            </footer>
          </div>

          {/* Mobile bottom nav — 5-tab with center FAB */}
          <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-lg md:hidden">
            <div className="mx-auto grid max-w-md grid-cols-5 items-end px-2 pb-1 pt-1.5">
              <MobileNavLink
                href="/"
                label="Hoy"
                icon={<Home className="h-5 w-5" />}
              />
              <MobileNavLink
                href="/history"
                label="Historial"
                icon={<ClipboardList className="h-5 w-5" />}
              />
              <MobileNavLink
                href="/log"
                label="Registrar"
                icon={<Plus className="h-5 w-5" strokeWidth={2.5} />}
                variant="primary"
              />
              <MobileNavLink
                href="/insights"
                label="Progreso"
                icon={<TrendingUp className="h-5 w-5" />}
              />
              <MobileNavLink
                href="/settings"
                label="Ajustes"
                icon={<Settings className="h-5 w-5" />}
              />
            </div>
          </nav>
        </div>
      </body>
    </html>
  );
}
