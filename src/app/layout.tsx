import type { Metadata } from "next";
import Link from "next/link";
import {
  Home,
  Calendar,
  Brain,
  ClipboardList,
  Settings,
  PlusCircle,
} from "lucide-react";
import { NavLink, MobileNavLink } from "@/app/ui/NavLink";
import FloatingLogButton from "@/app/ui/FloatingLogButton";
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
            <header className="mb-4 flex items-center justify-between">
              <Link href="/" className="group inline-flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-card bg-primary text-xs font-bold text-primary-text shadow-card transition-transform group-hover:scale-105">
                  K
                </span>
                <span className="text-sm font-semibold text-txt-primary">KaitonRun</span>
              </Link>

              {/* Desktop nav */}
              <nav className="hidden flex-wrap items-center gap-1 md:flex">
                <NavLink href="/" label="Inicio" icon={<Home className="h-4 w-4" />} />
                <NavLink href="/entrenamientos" label="Entrenamientos" icon={<Calendar className="h-4 w-4" />} />
                <NavLink href="/coach" label="Coach" icon={<Brain className="h-4 w-4" />} />
                <NavLink href="/historial" label="Historial" icon={<ClipboardList className="h-4 w-4" />} />
                <NavLink href="/ajustes" label="Ajustes" icon={<Settings className="h-4 w-4" />} />
                <Link
                  href="/log"
                  className="ml-2 inline-flex items-center gap-2 rounded-card bg-primary px-4 py-2 text-sm font-semibold text-primary-text shadow-card transition-colors hover:bg-primary-hover"
                >
                  <PlusCircle className="h-4 w-4" />
                  Registrar
                </Link>
              </nav>
            </header>

            <div className="animate-fade-in">{children}</div>

            <footer className="mt-10 hidden border-t border-border pt-6 text-center text-xs text-txt-muted md:block">
              KaitonRun v0.2 &middot; Training Log
            </footer>
          </div>

          {/* FAB flotante (visible en Home y Entrenamientos) */}
          <FloatingLogButton />

          {/* Mobile bottom nav — 5 tabs */}
          <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/95 backdrop-blur-lg md:hidden">
            <div className="mx-auto grid max-w-md grid-cols-5 items-end px-2 pb-1 pt-1.5">
              <MobileNavLink
                href="/"
                label="Inicio"
                icon={<Home className="h-5 w-5" />}
              />
              <MobileNavLink
                href="/entrenamientos"
                label="Entrenos"
                icon={<Calendar className="h-5 w-5" />}
                variant="primary"
              />
              <MobileNavLink
                href="/coach"
                label="Coach"
                icon={<Brain className="h-5 w-5" />}
                variant="accent"
              />
              <MobileNavLink
                href="/historial"
                label="Historial"
                icon={<ClipboardList className="h-5 w-5" />}
              />
              <MobileNavLink
                href="/ajustes"
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
