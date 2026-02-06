import Link from "next/link";
import { Download, Info, Zap } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { loadTokens } from "@/lib/strava";
import { programMeta } from "@/lib/plan";
import StravaClient from "@/app/strava/ui/StravaClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
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

  const today = new Date();
  const { phase, weeksToRace } = programMeta(today);

  const raceDate = process.env.NEXT_PUBLIC_RACE_DATE || "2026-09-13";
  const startDate = process.env.NEXT_PUBLIC_PLAN_START_DATE || "2026-02-05";

  return (
    <main className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Ajustes</h2>
        <p className="text-sm text-slate-500">Conexiones, datos y configuración.</p>
      </div>

      {/* STRAVA CONNECTION */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-white">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
              </svg>
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Strava</CardTitle>
              <CardDescription>Sincroniza carreras automáticamente.</CardDescription>
            </div>
            <Badge variant={isConnected ? "done" : "pending"}>
              {isConnected ? "Conectado" : "No conectado"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <StravaClient isConnected={isConnected} athleteName={athleteName} />
        </CardContent>
      </Card>

      {/* DATA EXPORT */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Exportar datos</CardTitle>
              <CardDescription>Descarga tus entrenamientos en CSV.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="secondary">
              <Link href="/api/export?format=csv">
                <Download className="h-3.5 w-3.5" />
                Todo (CSV)
              </Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link href="/api/export?format=json">
                Todo (JSON)
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* PLAN INFO */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Plan de entrenamiento</CardTitle>
              <CardDescription>Configuración actual del plan.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
              <div className="text-xs font-medium text-slate-500">Fecha de inicio</div>
              <div className="mt-1 font-semibold text-slate-900">{startDate}</div>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
              <div className="text-xs font-medium text-slate-500">Fecha de carrera</div>
              <div className="mt-1 font-semibold text-slate-900">{raceDate}</div>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
              <div className="text-xs font-medium text-slate-500">Fase actual</div>
              <div className="mt-1 font-semibold text-slate-900">{phase}</div>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
              <div className="text-xs font-medium text-slate-500">Semanas a carrera</div>
              <div className="mt-1 font-semibold text-slate-900">{weeksToRace}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ABOUT */}
      <Card className="border-slate-100">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
              K
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">KaitonRun v0.1</div>
              <div className="text-xs text-slate-500">Training Log MVP &middot; Media Maratón Sep 2026</div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
            <Zap className="h-3 w-3" />
            Powered by Next.js + Strava API + GitHub API
          </div>
        </CardContent>
      </Card>

      {/* STRAVA SETUP HELP */}
      <Card className="border-slate-100">
        <CardContent className="p-4">
          <div className="text-xs font-medium text-slate-500">Configuración de Strava</div>
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
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
