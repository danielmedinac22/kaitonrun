"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const PERIODS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "Todo", days: 0 },
];

export default function HistorialHeader() {
  const searchParams = useSearchParams();
  const currentDays = searchParams.get("days") ?? "7";

  return (
    <div className="flex flex-wrap gap-1.5">
      {PERIODS.map((p) => {
        const isActive = String(p.days) === currentDays || (p.days === 0 && currentDays === "0");
        return (
          <Link
            key={p.label}
            href={`/historial?days=${p.days}`}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm font-medium transition-all",
              isActive
                ? "border-primary/40 bg-primary-soft text-primary"
                : "border-border bg-surface text-txt-secondary hover:border-border",
            )}
          >
            {p.label}
          </Link>
        );
      })}
    </div>
  );
}
