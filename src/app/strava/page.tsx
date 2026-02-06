import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { loadTokens } from "@/lib/strava";
import StravaClient from "./ui/StravaClient";

export const dynamic = "force-dynamic";

export default async function StravaPage({
  searchParams,
}: {
  searchParams?: { connected?: string; error?: string };
}) {
  let isConnected = false;
  let athleteName = "";

  try {
    const tokens = await loadTokens();
    if (tokens) {
      isConnected = true;
      athleteName = tokens.athlete_name;
    }
  } catch {
    // Not connected
  }

  const justConnected = searchParams?.connected === "1";
  const error = searchParams?.error;

  return (
    <main className="space-y-5">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-white">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
              </svg>
            </div>
            <div>
              <CardTitle>Strava</CardTitle>
              <CardDescription>Importa actividades desde tu cuenta de Strava.</CardDescription>
            </div>
            <div className="ml-auto">
              <Badge variant={isConnected ? "done" : "pending"}>
                {isConnected ? "Conectado" : "No conectado"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {justConnected && (
            <div className="animate-fade-in mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              Strava conectado correctamente. Ya puedes sincronizar tus actividades.
            </div>
          )}

          {error && (
            <div className="animate-fade-in mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              Error: {error}
            </div>
          )}

          <StravaClient isConnected={isConnected} athleteName={athleteName} />
        </CardContent>
      </Card>

      <Card className="border-slate-100">
        <CardContent className="p-4">
          <div className="text-xs font-medium text-slate-500">Configuración necesaria</div>
          <div className="mt-2 space-y-2 text-sm text-slate-600">
            <p>
              Para conectar Strava necesitas crear una app en{" "}
              <Link
                href="https://www.strava.com/settings/api"
                className="font-medium text-indigo-600 hover:underline"
                target="_blank"
              >
                strava.com/settings/api
              </Link>{" "}
              y configurar estas variables de entorno:
            </p>
            <div className="rounded-lg bg-slate-50 p-3 font-mono text-xs">
              <div>STRAVA_CLIENT_ID=tu_client_id</div>
              <div>STRAVA_CLIENT_SECRET=tu_client_secret</div>
              <div>NEXT_PUBLIC_APP_URL=https://tu-dominio.vercel.app</div>
            </div>
            <p className="text-xs text-slate-500">
              En Strava, configura el Authorization Callback Domain como tu dominio
              (ej: tu-dominio.vercel.app o localhost para desarrollo).
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
