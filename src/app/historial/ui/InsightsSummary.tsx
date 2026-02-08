import Link from "next/link";
import { Lightbulb, Brain } from "lucide-react";

export default function InsightsSummary({ insights }: { insights: string[] }) {
  if (insights.length === 0) return null;

  return (
    <div className="rounded-xl border border-warning/20 bg-warning-soft p-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-warning mb-2">
        <Lightbulb className="h-4 w-4" />
        Insights
      </div>
      <ul className="space-y-1">
        {insights.map((insight, i) => (
          <li key={i} className="text-sm text-txt-primary">{insight}</li>
        ))}
      </ul>
      <Link
        href="/coach"
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-secondary hover:opacity-80 transition-colors"
      >
        <Brain className="h-3 w-3" />
        Habla con el coach para más detalles
      </Link>
    </div>
  );
}
