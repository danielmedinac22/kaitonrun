import { CheckCircle2, Clock, TrendingUp, Flame, ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { KPIs } from "@/lib/stats";

function DeltaBadge({ current, previous, suffix = "" }: { current: number; previous: number; suffix?: string }) {
  if (previous === 0) return null;
  const diff = current - previous;
  const pct = Math.round((diff / previous) * 100);
  if (pct === 0) return null;

  const isUp = pct > 0;
  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
      isUp ? "bg-success-soft text-success" : "bg-danger/10 text-danger",
    )}>
      {isUp ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
      {Math.abs(pct)}{suffix}
    </span>
  );
}

export default function KPICardsGrid({ kpis, prevKpis }: { kpis: KPIs; prevKpis?: KPIs }) {
  return (
    <div className="stagger-children grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <div className="text-xs font-medium text-txt-secondary">Cumplimiento</div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <div className="text-3xl font-bold text-txt-primary">{kpis.completionPct}%</div>
            <div className="text-sm text-txt-secondary">{kpis.doneCount}/{kpis.plannedCount}</div>
            {prevKpis && <DeltaBadge current={kpis.completionPct} previous={prevKpis.completionPct} suffix="%" />}
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-elevated">
            <div
              className="animate-progress h-full rounded-full bg-primary"
              style={{ width: `${kpis.completionPct}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-success-soft text-success">
              <Clock className="h-4 w-4" />
            </span>
            <div className="text-xs font-medium text-txt-secondary">Minutos</div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <div className="text-3xl font-bold text-txt-primary">{kpis.doneMinutes}</div>
            <div className="text-sm text-txt-secondary">/ {kpis.plannedMinutes} min</div>
            {prevKpis && <DeltaBadge current={kpis.doneMinutes} previous={prevKpis.doneMinutes} suffix="%" />}
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-elevated">
            <div
              className="animate-progress h-full rounded-full bg-success"
              style={{ width: `${Math.min(100, kpis.plannedMinutes > 0 ? Math.round((kpis.doneMinutes / kpis.plannedMinutes) * 100) : 0)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning-soft text-warning">
              <TrendingUp className="h-4 w-4" />
            </span>
            <div className="text-xs font-medium text-txt-secondary">RPE promedio</div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <div className="text-3xl font-bold text-txt-primary">{kpis.avgRpe ?? "—"}</div>
            {prevKpis?.avgRpe != null && kpis.avgRpe != null && (
              <DeltaBadge current={kpis.avgRpe} previous={prevKpis.avgRpe} />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <Flame className="h-4 w-4" />
            </span>
            <div className="text-xs font-medium text-txt-secondary">Racha</div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <div className="text-3xl font-bold text-txt-primary">{kpis.streak}</div>
            <div className="text-sm text-txt-secondary">días</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
