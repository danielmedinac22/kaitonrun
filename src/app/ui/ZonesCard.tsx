"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type Zones = {
  hr_max: number;
  hr_rest: number;
  hr_zones: {
    z1: { min: number; max: number };
    z2: { min: number; max: number };
    z3: { min: number; max: number };
    z4: { min: number; max: number };
    z5: { min: number; max: number };
  };
  lactate_threshold_hr: number;
  aerobic_threshold_hr: number;
  pace_zones?: {
    easy: string;
    tempo: string;
    threshold: string;
    interval: string;
    sprint: string;
  };
  calculated_at: string;
  data_range_days: number;
};

type Profile = {
  zones?: Zones;
  goals?: {
    race_date: string;
    race_distance: string;
    target_time?: string;
    five_k_target?: string;
    ten_k_target?: string;
  };
};

const ZONE_COLORS = [
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-green-100 text-green-700 border-green-200",
  "bg-yellow-100 text-yellow-700 border-yellow-200",
  "bg-orange-100 text-orange-700 border-orange-200",
  "bg-red-100 text-red-700 border-red-200",
];

const ZONE_LABELS = ["Z1 Recuperación", "Z2 Aeróbico", "Z3 Tempo", "Z4 Umbral", "Z5 VO2max"];

export default function ZonesCard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setProfile(data.profile);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const zones = profile?.zones;

  return (
    <Card className="border-rose-100">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
            <Heart className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">Zonas de entrenamiento</CardTitle>
            <CardDescription>
              {zones
                ? `Calculadas el ${zones.calculated_at} (últimos ${zones.data_range_days} días)`
                : "Pídele al coach que calcule tus zonas."}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && <p className="text-sm text-slate-400">Cargando...</p>}

        {!loading && !zones && (
          <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
            No hay zonas calculadas aún. Abre el coach y dile{" "}
            <span className="font-semibold">&quot;Calcula mis zonas&quot;</span> para que las calcule
            basándose en tus datos de Strava.
          </div>
        )}

        {!loading && zones && (
          <div className="space-y-4">
            {/* HR Zones */}
            <div className="grid gap-1.5">
              {(["z1", "z2", "z3", "z4", "z5"] as const).map((z, i) => {
                const zone = zones.hr_zones[z];
                const pct = ((zone.max - zones.hr_rest) / (zones.hr_max - zones.hr_rest)) * 100;
                return (
                  <div key={z} className="flex items-center gap-2">
                    <span className={`w-28 rounded-md border px-2 py-1 text-xs font-semibold ${ZONE_COLORS[i]}`}>
                      {ZONE_LABELS[i]}
                    </span>
                    <div className="flex-1">
                      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all ${ZONE_COLORS[i].split(" ")[0]}`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-24 text-right text-xs font-medium text-slate-600">
                      {zone.min}–{zone.max} bpm
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Thresholds */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2.5">
                <div className="text-[10px] font-medium text-slate-400">Umbral aeróbico</div>
                <div className="text-lg font-bold text-slate-900">{zones.aerobic_threshold_hr} <span className="text-xs font-normal text-slate-500">bpm</span></div>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2.5">
                <div className="text-[10px] font-medium text-slate-400">Umbral de lactato</div>
                <div className="text-lg font-bold text-slate-900">{zones.lactate_threshold_hr} <span className="text-xs font-normal text-slate-500">bpm</span></div>
              </div>
            </div>

            {/* Pace zones */}
            {zones.pace_zones && (
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-slate-500">Zonas de ritmo</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {(["easy", "tempo", "threshold", "interval"] as const).map((p) => (
                    <div key={p} className="rounded-md border border-slate-100 bg-white px-2 py-1.5 text-xs">
                      <span className="font-medium capitalize text-slate-600">{p === "easy" ? "Fácil" : p === "tempo" ? "Tempo" : p === "threshold" ? "Umbral" : "Intervalo"}</span>
                      <span className="ml-1 text-slate-900">{zones.pace_zones![p]} min/km</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Goals */}
            {profile?.goals && (
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-slate-500">Objetivos</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {profile.goals.target_time && (
                    <div className="rounded-md border border-indigo-100 bg-indigo-50/50 px-2 py-1.5 text-xs">
                      <span className="font-medium text-indigo-600">Media maratón</span>
                      <span className="ml-1 font-bold text-indigo-900">{profile.goals.target_time}</span>
                    </div>
                  )}
                  {profile.goals.five_k_target && (
                    <div className="rounded-md border border-indigo-100 bg-indigo-50/50 px-2 py-1.5 text-xs">
                      <span className="font-medium text-indigo-600">5K</span>
                      <span className="ml-1 font-bold text-indigo-900">{profile.goals.five_k_target}</span>
                    </div>
                  )}
                  {profile.goals.ten_k_target && (
                    <div className="rounded-md border border-indigo-100 bg-indigo-50/50 px-2 py-1.5 text-xs">
                      <span className="font-medium text-indigo-600">10K</span>
                      <span className="ml-1 font-bold text-indigo-900">{profile.goals.ten_k_target}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
