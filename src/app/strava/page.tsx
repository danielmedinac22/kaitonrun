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
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Badge variant="done">Conectado</Badge>
                <div className="text-sm text-emerald-800">
                  Strava conectado correctamente. Ya puedes sincronizar tus actividades.
                </div>
              </div>
              <a
                href="/settings"
                className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline"
              >
                Ir a Ajustes
              </a>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="text-sm text-red-800">Error: {error}</div>
              <a
                href="/settings"
                className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline"
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
  redirect("/settings");
}
