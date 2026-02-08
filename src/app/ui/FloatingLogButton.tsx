"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

const VISIBLE_PATHS = ["/", "/entrenamientos", "/coach", "/historial"];

export default function FloatingLogButton() {
  const pathname = usePathname();
  const show = VISIBLE_PATHS.some(
    (p) => p === "/" ? pathname === "/" : pathname.startsWith(p),
  );

  if (!show) return null;

  return (
    <Link
      href="/log"
      className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-text shadow-elevated transition-all hover:bg-primary-hover hover:scale-105 active:scale-95 md:bottom-6"
      aria-label="Registrar entrenamiento"
    >
      <Plus className="h-6 w-6" strokeWidth={2.5} />
    </Link>
  );
}
