import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function StravaPage({
  searchParams,
}: {
  searchParams?: { connected?: string; error?: string };
}) {
  const justConnected = searchParams?.connected === "1";
  const error = searchParams?.error;

  // If just connected or has an error, show the message then link to settings
  if (justConnected || error) {
    return (
      <main className="space-y-5">
        {justConnected && (
          <Card className="border-success/30 bg-success-soft">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Badge variant="done">Conectado</Badge>
                <div className="text-sm text-success">
                  Strava conectado correctamente. Ya puedes sincronizar tus actividades.
                </div>
              </div>
              <a
                href="/ajustes"
                className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
              >
                Ir a Ajustes
              </a>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-danger/30 bg-danger/10">
            <CardContent className="p-4">
              <div className="text-sm text-danger">Error: {error}</div>
              <a
                href="/ajustes"
                className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
              >
                Ir a Ajustes
              </a>
            </CardContent>
          </Card>
        )}
      </main>
    );
  }

  // Otherwise redirect to settings
  redirect("/ajustes");
}
