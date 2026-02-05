import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { readWorkouts } from "@/lib/workouts";
import HistoryClient from "./ui/HistoryClient";

export const dynamic = "force-dynamic";

export default function HistoryPage() {
  const workouts = readWorkouts().sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <main className="space-y-4">
      <Card>
        <CardHeader title="Historial" subtitle="Filtra por tipo, duración y RPE." />
        <CardBody>
          <HistoryClient workouts={workouts} />
        </CardBody>
      </Card>
    </main>
  );
}
