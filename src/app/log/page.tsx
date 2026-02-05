import { Card, CardBody, CardHeader } from "@/components/ui/card";
import LogForm from "./ui/LogForm";

export const dynamic = "force-dynamic";

export default function LogPage({ searchParams }: { searchParams?: Record<string, string> }) {
  const date = searchParams?.date;

  return (
    <main className="space-y-4">
      <Card>
        <CardHeader
          title="Registrar entrenamiento"
          subtitle="Duración + RPE + notas. Próximo paso: guardar como commit en GitHub."
        />
        <CardBody>
          <LogForm defaultDate={date} />
        </CardBody>
      </Card>
    </main>
  );
}
