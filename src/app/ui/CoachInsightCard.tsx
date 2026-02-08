import Link from "next/link";
import { Brain, ChevronRight } from "lucide-react";
import type { PlanOverrides } from "@/lib/athlete";

export default function CoachInsightCard({
  overrides,
}: {
  overrides: PlanOverrides;
}) {
  const entries = Object.entries(overrides)
    .filter(([, v]) => v.coachNote)
    .sort(([a], [b]) => (a > b ? -1 : 1));

  if (entries.length === 0) return null;

  const [, override] = entries[0];

  return (
    <Link
      href="/coach"
      className="group flex items-start gap-3 rounded-card-lg border border-secondary/15 bg-secondary-soft p-4 transition-all hover:border-secondary/30 hover:shadow-card-hover"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
        <Brain className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-txt-muted">Tu coach</div>
        <div className="text-sm leading-relaxed text-txt-primary">
          {override.coachNote}
        </div>
      </div>
      <span className="hidden shrink-0 text-xs font-semibold text-secondary sm:inline">
        Hablar con coach
      </span>
      <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-txt-muted transition-transform group-hover:translate-x-0.5 group-hover:text-secondary sm:hidden" />
    </Link>
  );
}
