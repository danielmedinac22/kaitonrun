import { startOfWeek } from "date-fns";

import CoachChat from "@/app/ui/CoachChat";
import CoachContextHeader from "./ui/CoachContextHeader";
import CoachTabs from "./ui/CoachTabs";
import RecentCoachChanges from "./ui/RecentCoachChanges";
import { programMeta } from "@/lib/plan";
import { readWorkouts } from "@/lib/workouts";
import { loadOverrides } from "@/lib/athlete";
import { computeKPIs } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function CoachPage() {
  const today = new Date();
  const meta = programMeta(today);
  const workouts = await readWorkouts();
  const overrides = await loadOverrides();

  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const kpis = computeKPIs(workouts, { start: weekStart, end: weekEnd }, workouts);

  return (
    <main className="space-y-4">
      <CoachContextHeader
        phase={meta.phase}
        weeksToRace={meta.weeksToRace}
        weekIndex={meta.weekIndex}
        avgRpe={kpis.avgRpe}
        completionPct={kpis.completionPct}
      />

      <CoachTabs
        chatSlot={<CoachChat />}
        changesSlot={<RecentCoachChanges overrides={overrides} />}
      />
    </main>
  );
}
