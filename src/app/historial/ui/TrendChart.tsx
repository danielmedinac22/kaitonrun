import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TrendWeek } from "@/lib/stats";

function barColor(minutes: number, max: number) {
  const ratio = max > 0 ? minutes / max : 0;
  if (ratio >= 0.7) return "bg-primary";
  if (ratio >= 0.4) return "bg-success";
  return "bg-warning";
}

export default function TrendChart({ trend }: { trend: TrendWeek[] }) {
  const maxMinutes = Math.max(1, ...trend.map((t) => t.minutes));

  return (
    <Card>
      <CardHeader>
        <CardTitle>ltimas 8 semanas</CardTitle>
        <CardDescription>Minutos registrados por semana.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {trend.map((t, i) => {
            const w = Math.round((Math.min(t.minutes, maxMinutes) / maxMinutes) * 100);
            const isLast = i === trend.length - 1;
            return (
              <div key={t.wkStart.toISOString()} className="flex items-center gap-3">
                <div className={`w-20 text-xs font-semibold ${isLast ? "text-primary" : "text-txt-secondary"}`}>
                  {format(t.wkStart, "dd MMM")}
                </div>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface-elevated">
                  <div
                    className={`animate-progress h-full rounded-full transition-all ${barColor(t.minutes, maxMinutes)}`}
                    style={{ width: `${w}%`, animationDelay: `${i * 100}ms` }}
                  />
                </div>
                <div className={`w-16 text-right text-xs font-medium ${isLast ? "text-primary" : "text-txt-secondary"}`}>
                  {t.minutes}m
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
