"use client";

import { useState, useEffect, useCallback } from "react";
import { Heart, RefreshCw } from "lucide-react";
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
  "bg-info-soft text-info border-info/30",
  "bg-success-soft text-success border-success/30",
  "bg-warning-soft text-warning border-warning/30",
  "bg-primary-soft text-primary border-primary/30",
  "bg-danger/10 text-danger border-danger/30",
];

const ZONE_LABELS = ["Z1 Recuperación", "Z2 Aeróbico", "Z3 Tempo", "Z4 Umbral", "Z5 VO2max"];

export default function ZonesCard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(() => {
    setLoading(true);
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setProfile(data.profile);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Listen for custom event from coach when zones are updated
  useEffect(() => {
    function onZonesUpdated() {
      fetchProfile();
    }
    window.addEventListener("zones-updated", onZonesUpdated);
    return () => window.removeEventListener("zones-updated", onZonesUpdated);
  }, [fetchProfile]);

  // Also refetch when tab becomes visible (user might have used coach in another tab)
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === "visible") {
        fetchProfile();
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [fetchProfile]);

  const zones = profile?.zones;

  return (
    <Card className="border-danger/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger/10 text-danger">
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
          {zones && (
            <button
              onClick={fetchProfile}
              className="rounded-lg p-2 text-txt-muted transition-colors hover:bg-surface-elevated hover:text-txt-secondary"
              title="Actualizar zonas"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading && !profile && <p className="text-sm text-txt-muted">Cargando...</p>}

        {!loading && !zones && (
          <div className="rounded-lg bg-danger/10 p-3 text-sm text-danger">
            No hay zonas calculadas aún. Abre el coach y dile{" "}
            <span className="font-semibold">&quot;Calcula mis zonas&quot;</span> para que las calcule
            basándose en tus datos de Strava.
          </div>
        )}

        {zones && (
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
                      <div className="h-3 overflow-hidden rounded-full bg-surface-elevated">
                        <div
                          className={`h-full rounded-full transition-all ${ZONE_COLORS[i].split(" ")[0]}`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-24 text-right text-xs font-medium text-txt-secondary">
                      {zone.min}–{zone.max} bpm
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Thresholds */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-border bg-surface-elevated p-2.5">
                <div className="text-[10px] font-medium text-txt-muted">Umbral aeróbico</div>
                <div className="text-lg font-bold text-txt-primary">{zones.aerobic_threshold_hr} <span className="text-xs font-normal text-txt-secondary">bpm</span></div>
              </div>
              <div className="rounded-lg border border-border bg-surface-elevated p-2.5">
                <div className="text-[10px] font-medium text-txt-muted">Umbral de lactato</div>
                <div className="text-lg font-bold text-txt-primary">{zones.lactate_threshold_hr} <span className="text-xs font-normal text-txt-secondary">bpm</span></div>
              </div>
            </div>

            {/* Pace zones */}
            {zones.pace_zones && (
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-txt-secondary">Zonas de ritmo</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {(["easy", "tempo", "threshold", "interval"] as const).map((p) => (
                    <div key={p} className="rounded-md border border-border bg-surface px-2 py-1.5 text-xs">
                      <span className="font-medium capitalize text-txt-secondary">{p === "easy" ? "Fácil" : p === "tempo" ? "Tempo" : p === "threshold" ? "Umbral" : "Intervalo"}</span>
                      <span className="ml-1 text-txt-primary">{zones.pace_zones![p]} min/km</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Goals */}
            {profile?.goals && (
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-txt-secondary">Objetivos</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {profile.goals.target_time && (
                    <div className="rounded-md border border-primary/20 bg-primary-soft px-2 py-1.5 text-xs">
                      <span className="font-medium text-primary">Media maratón</span>
                      <span className="ml-1 font-bold text-txt-primary">{profile.goals.target_time}</span>
                    </div>
                  )}
                  {profile.goals.five_k_target && (
                    <div className="rounded-md border border-primary/20 bg-primary-soft px-2 py-1.5 text-xs">
                      <span className="font-medium text-primary">5K</span>
                      <span className="ml-1 font-bold text-txt-primary">{profile.goals.five_k_target}</span>
                    </div>
                  )}
                  {profile.goals.ten_k_target && (
                    <div className="rounded-md border border-primary/20 bg-primary-soft px-2 py-1.5 text-xs">
                      <span className="font-medium text-primary">10K</span>
                      <span className="ml-1 font-bold text-txt-primary">{profile.goals.ten_k_target}</span>
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
