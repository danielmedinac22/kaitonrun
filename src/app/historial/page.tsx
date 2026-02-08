import { Suspense } from "react";
import { startOfWeek } from "date-fns";

import { readWorkouts } from "@/lib/workouts";
import { computeKPIs, computeTrend, computePersonalRecords, computePaceTrend, generateInsights } from "@/lib/stats";

import HistorialHeader from "./ui/HistorialHeader";
import InsightsSummary from "./ui/InsightsSummary";
import KPICardsGrid from "./ui/KPICardsGrid";
import TrendChart from "./ui/TrendChart";
import PersonalRecords from "./ui/PersonalRecords";
import PaceTrend from "./ui/PaceTrend";
import HistoryClient from "./ui/HistoryClient";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function HistorialPage({
  searchParams,
}: {
  searchParams?: { days?: string };
}) {
  const workouts = await readWorkouts();
  const sorted = [...workouts].sort((a, b) => (a.date < b.date ? 1 : -1));

  const today = new Date();
  const daysParam = Number(searchParams?.days ?? 7);
  const daysCount = daysParam > 0 ? daysParam : 365;

  const start = new Date(today);
  start.setDate(start.getDate() - daysCount);
  const end = today;

  // Current period KPIs
  const kpis = computeKPIs(workouts, { start, end }, workouts);

  // Previous period KPIs (for deltas)
  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - daysCount);
  const prevKpis = computeKPIs(workouts, { start: prevStart, end: start }, workouts);

  const trend = computeTrend(workouts);
  const records = computePersonalRecords(workouts);
  const paces = computePaceTrend(workouts);
  const insights = generateInsights(workouts, { start, end });

  return (
    <main className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-txt-primary">Historial</h2>
        <p className="mt-0.5 text-sm text-txt-secondary">Análisis, tendencias y récords.</p>
      </div>

      <Suspense fallback={null}>
        <HistorialHeader />
      </Suspense>

      <InsightsSummary insights={insights} />

      <KPICardsGrid kpis={kpis} prevKpis={prevKpis} />

      <TrendChart trend={trend} />

      <PersonalRecords records={records} />

      <PaceTrend paces={paces} />

      {/* Workout list — collapsible */}
      <Accordion type="single" collapsible>
        <AccordionItem value="workouts" className="border rounded-xl overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div>
              <div className="text-sm font-semibold text-txt-primary">Entrenamientos</div>
              <div className="text-xs text-txt-secondary">{sorted.length} registros · Filtra por tipo, duración, RPE y fuente</div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <HistoryClient workouts={sorted} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </main>
  );
}
