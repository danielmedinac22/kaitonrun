import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LogForm from "./ui/LogForm";

export const dynamic = "force-dynamic";

export default function LogPage({ searchParams }: { searchParams?: Record<string, string> }) {
  const date = searchParams?.date;

  return (
    <main className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Registrar entrenamiento</CardTitle>
          <CardDescription>Tipo, duración, RPE y notas de tu sesión.</CardDescription>
        </CardHeader>
        <CardContent>
          <LogForm defaultDate={date} />
        </CardContent>
      </Card>
    </main>
  );
}
