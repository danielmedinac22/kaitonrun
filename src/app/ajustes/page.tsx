import Link from "next/link";
import { Download, Calendar, Zap, Activity } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { loadTokens } from "@/lib/strava";
import { loadProfile } from "@/lib/athlete";
import StravaClient from "@/app/strava/ui/StravaClient";
import ZonesCard from "@/app/ui/ZonesCard";
import SyncButton from "@/app/ui/SyncButton";

export const dynamic = "force-dynamic";

export default async function AjustesPage() {
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

  const profile = await loadProfile();

  return (
    <main className="space-y-5">
      {/* PROFILE HEADER */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-text shadow-sm">
          {(profile?.name || athleteName || "K").charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-txt-primary">
            {profile?.name || athleteName || "Mi Perfil"}
          </h2>
          <p className="text-sm text-txt-secondary">
            Media maratn &middot; {process.env.NEXT_PUBLIC_RACE_DATE || "2026-09-13"}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={isConnected ? "done" : "pending"} className="text-[10px]">
              {isConnected ? "Strava conectado" : "Strava desconectado"}
            </Badge>
          </div>
        </div>
      </div>

      {/* --- CONEXIONES --- */}
      <h3 className="text-xs font-semibold uppercase tracking-wider text-txt-muted">Conexiones</h3>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-text">
              <Activity className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Strava</CardTitle>
              <CardDescription>Sincroniza tus actividades.</CardDescription>
            </div>
            <Badge variant={isConnected ? "done" : "pending"}>
              {isConnected ? "Conectado" : "No conectado"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <StravaClient isConnected={isConnected} athleteName={athleteName} />
          {isConnected && (
            <div className="border-t border-border pt-4">
              <div className="text-xs font-medium text-txt-secondary mb-2">Sync rpido</div>
              <SyncButton />
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- ENTRENAMIENTO --- */}
      <h3 className="text-xs font-semibold uppercase tracking-wider text-txt-muted mt-2">Entrenamiento</h3>
      <ZonesCard />

      {/* --- DATOS --- */}
      <h3 className="text-xs font-semibold uppercase tracking-wider text-txt-muted mt-2">Datos</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {/* PLAN INFO */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-elevated text-txt-secondary">
                <Calendar className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm">Plan de entrenamiento</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-txt-primary">
              <div className="flex justify-between">
                <span className="text-txt-secondary">Frecuencia</span>
                <span className="font-medium">3 run + 2 gym / sem</span>
              </div>
              <div className="flex justify-between">
                <span className="text-txt-secondary">Running</span>
                <span className="font-medium">Mar / Jue / Dom</span>
              </div>
              <div className="flex justify-between">
                <span className="text-txt-secondary">Gym</span>
                <span className="font-medium">Lun / Vie</span>
              </div>
              <div className="flex justify-between">
                <span className="text-txt-secondary">Modelo IA</span>
                <span className="font-medium">GPT-5.2</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DATA EXPORT */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success-soft text-success">
                <Download className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm">Exportar datos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-txt-secondary">Descarga tus entrenamientos.</p>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="secondary">
                <Link href="/api/export?format=csv">
                  <Download className="h-3.5 w-3.5" />
                  CSV
                </Link>
              </Button>
              <Button asChild size="sm" variant="secondary">
                <Link href="/api/export?format=json">
                  JSON
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ABOUT */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-text">
              K
            </div>
            <div>
              <div className="text-sm font-semibold text-txt-primary">KaitonRun v0.2</div>
              <div className="text-xs text-txt-secondary">Training Log &middot; Media Maratn Sep 2026</div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-txt-muted">
            <Zap className="h-3 w-3" />
            Powered by Next.js + GPT-5.2 + Strava API + GitHub API
          </div>
        </CardContent>
      </Card>

      {/* STRAVA SETUP HELP */}
      {!isConnected && (
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium text-txt-secondary">Configuracin de Strava</div>
            <div className="mt-2 space-y-2 text-sm text-txt-primary">
              <p>
                Para conectar Strava necesitas crear una app en{" "}
                <Link
                  href="https://www.strava.com/settings/api"
                  className="font-medium text-primary hover:underline"
                  target="_blank"
                >
                  strava.com/settings/api
                </Link>{" "}
                y configurar las variables de entorno.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
