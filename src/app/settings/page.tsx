import Link from "next/link";
import { Download, Target, Calendar, Zap, Activity } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { loadTokens } from "@/lib/strava";
import { loadProfile } from "@/lib/athlete";
import { programMeta } from "@/lib/plan";
import StravaClient from "@/app/strava/ui/StravaClient";
import ZonesCard from "@/app/ui/ZonesCard";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
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
  const today = new Date();
  const meta = programMeta(today);

  const raceDate = process.env.NEXT_PUBLIC_RACE_DATE || "2026-09-13";

  return (
    <main className="space-y-5">
      {/* PROFILE HEADER */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-bold text-white shadow-sm">
          {(profile?.name || athleteName || "K").charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-900">
            {profile?.name || athleteName || "Mi Perfil"}
          </h2>
          <p className="text-sm text-slate-500">
            Media maratón &middot; {raceDate}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={isConnected ? "done" : "pending"} className="text-[10px]">
              {isConnected ? "Strava conectado" : "Strava desconectado"}
            </Badge>
            <Badge variant="default" className="bg-indigo-50 text-indigo-700 text-[10px]">
              Fase {meta.phase}
            </Badge>
          </div>
        </div>
      </div>

      {/* TRAINING STATUS OVERVIEW */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-slate-100">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-indigo-600">{meta.weekIndex}</div>
            <div className="text-[10px] font-medium text-slate-500">Semana</div>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-indigo-600">{meta.weeksToRace}</div>
            <div className="text-[10px] font-medium text-slate-500">Semanas a carrera</div>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-slate-900 capitalize">{meta.phase}</div>
            <div className="text-[10px] font-medium text-slate-500">Fase actual</div>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-slate-900">{meta.phaseWeek}</div>
            <div className="text-[10px] font-medium text-slate-500">Semana de fase</div>
          </CardContent>
        </Card>
      </div>

      {/* GOALS */}
      {profile?.goals && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">Objetivos</CardTitle>
                <CardDescription>Metas definidas con tu coach.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {profile.goals.target_time && (
                <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
                  <div className="text-[10px] font-medium text-indigo-500">Media maratón</div>
                  <div className="mt-0.5 text-lg font-bold text-indigo-900">{profile.goals.target_time}</div>
                </div>
              )}
              {profile.goals.five_k_target && (
                <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
                  <div className="text-[10px] font-medium text-indigo-500">5K</div>
                  <div className="mt-0.5 text-lg font-bold text-indigo-900">{profile.goals.five_k_target}</div>
                </div>
              )}
              {profile.goals.ten_k_target && (
                <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
                  <div className="text-[10px] font-medium text-indigo-500">10K</div>
                  <div className="mt-0.5 text-lg font-bold text-indigo-900">{profile.goals.ten_k_target}</div>
                </div>
              )}
              <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                <div className="text-[10px] font-medium text-slate-500">Carrera</div>
                <div className="mt-0.5 text-sm font-semibold text-slate-900">{profile.goals.race_distance} el {profile.goals.race_date}</div>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Puedes actualizar tus objetivos pidiéndole al coach que los ajuste.
            </p>
          </CardContent>
        </Card>
      )}

      {/* TRAINING ZONES */}
      <ZonesCard />

      {/* STRAVA CONNECTION */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-white">
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
        <CardContent>
          <StravaClient isConnected={isConnected} athleteName={athleteName} />
        </CardContent>
      </Card>

      {/* PLAN & DATA */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* PLAN INFO */}
        <Card className="border-slate-100">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Calendar className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm">Plan de entrenamiento</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-500">Frecuencia</span>
                <span className="font-medium">3 run + 2 gym / sem</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Running</span>
                <span className="font-medium">Mar / Jue / Dom</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gym</span>
                <span className="font-medium">Lun / Vie</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Modelo IA</span>
                <span className="font-medium">GPT-5.2</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DATA EXPORT */}
        <Card className="border-slate-100">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <Download className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm">Exportar datos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-slate-500">Descarga tus entrenamientos.</p>
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

      {/* COACH NOTES (if any) */}
      {profile?.coach_notes && (
        <Card className="border-amber-100">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-amber-600">Notas del coach</div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{profile.coach_notes}</p>
          </CardContent>
        </Card>
      )}

      {/* ABOUT */}
      <Card className="border-slate-100">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
              K
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">KaitonRun v0.2</div>
              <div className="text-xs text-slate-500">Training Log &middot; Media Maratón Sep 2026</div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
            <Zap className="h-3 w-3" />
            Powered by Next.js + GPT-5.2 + Strava API + GitHub API
          </div>
        </CardContent>
      </Card>

      {/* STRAVA SETUP HELP */}
      {!isConnected && (
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
                y configurar las variables de entorno.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
