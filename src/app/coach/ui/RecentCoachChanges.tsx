import { Sparkles } from "lucide-react";
import type { PlanOverrides } from "@/lib/athlete";

export default function RecentCoachChanges({
  overrides,
}: {
  overrides: PlanOverrides;
}) {
  const entries = Object.entries(overrides)
    .sort(([a], [b]) => (a > b ? -1 : 1))
    .slice(0, 5);

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface-elevated p-4 text-center">
        <p className="text-sm text-txt-secondary">No hay cambios del coach todava.</p>
        <p className="mt-1 text-xs text-txt-muted">Pdele al coach que ajuste tu plan para ver los cambios aqu.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-txt-primary">
        <Sparkles className="h-4 w-4 text-secondary" />
        Cambios recientes del coach
      </h3>
      <div className="space-y-2">
        {entries.map(([date, override]) => (
          <div
            key={date}
            className="rounded-lg border border-secondary/20 bg-surface p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-txt-secondary">{date}</span>
              <span className="text-xs font-medium text-secondary">{override.title}</span>
            </div>
            {override.coachNote && (
              <p className="mt-1.5 text-sm text-secondary">{override.coachNote}</p>
            )}
            {override.targetMinutes && (
              <span className="mt-1 inline-block text-xs text-txt-muted">
                {override.targetMinutes} min &middot; RPE {override.rpe ?? "—"}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
