import { differenceInCalendarDays, parseISO } from "date-fns";

export type PlanItemType = "run" | "gym" | "rest";

export type PlanItem = {
  type: PlanItemType;
  title: string;
  targetMinutes?: number;
  rpe?: string;
  details: string[];
  coachNote?: string; // note from AI coach when plan was overridden
  isOverride?: boolean;
};

export type PlanPhase = "base" | "build" | "specific" | "taper";

export type ProgramMeta = {
  weekIndex: number; // 1-based
  weeksToRace: number; // inclusive-ish, >=0
  phase: PlanPhase;
  phaseWeek: number; // 1-based within phase
};

// Program start date (first week anchor)
const START_DATE = process.env.NEXT_PUBLIC_PLAN_START_DATE || "2026-02-05";

// Approximate race date (Sunday in September by default). Override in Vercel env.
const RACE_DATE = process.env.NEXT_PUBLIC_RACE_DATE || "2026-09-13";

export function programWeekIndex(date: Date): number {
  const start = parseISO(START_DATE);
  const days = differenceInCalendarDays(date, start);
  return Math.max(1, Math.floor(days / 7) + 1);
}

export function programMeta(date: Date): ProgramMeta {
  const start = parseISO(START_DATE);
  const race = parseISO(RACE_DATE);
  const weekIndex = programWeekIndex(date);

  const daysToRace = Math.max(0, differenceInCalendarDays(race, date));
  const weeksToRace = Math.max(0, Math.ceil(daysToRace / 7));

  // Rough phase split for ~Feb → Sep with 3 run days/week:
  // - Base: weeks 1–4 (rebuild + consistency)
  // - Build: weeks 5–12 (volume + strength)
  // - Specific: weeks 13–(race-3) (HM-specific tempo/long-run)
  // - Taper: last 3 weeks
  const taperStartWeek = Math.max(1, programWeekIndex(race) - 2);

  let phase: PlanPhase = "specific";
  if (weekIndex <= 4) phase = "base";
  else if (weekIndex <= 12) phase = "build";
  else if (weekIndex >= taperStartWeek) phase = "taper";

  const phaseWeek =
    phase === "base"
      ? weekIndex
      : phase === "build"
        ? weekIndex - 4
        : phase === "taper"
          ? weekIndex - taperStartWeek + 1
          : weekIndex - 12;

  return { weekIndex, weeksToRace, phase, phaseWeek: Math.max(1, phaseWeek) };
}

function deloadWeek(weekIndex: number) {
  // every 4th week easier
  return weekIndex % 4 === 0;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function planForDate(date: Date): PlanItem {
  const dow = date.getDay(); // 0 Sun
  const { weekIndex: w, phase } = programMeta(date);

  // Planned running days: Tue (2), Thu (4), Sun (0)
  if (dow === 2) {
    const isDeload = deloadWeek(w);

    // Tuesday: easy + technique (kept easy in all phases)
    const baseMin = phase === "base" ? 35 : phase === "build" ? 45 : phase === "specific" ? 50 : 40;
    const progress = phase === "base" ? (w - 1) * 5 : phase === "build" ? (w - 5) * 2 : phase === "specific" ? (w - 13) : 0;
    const targetMinutes = clamp(baseMin + progress, 30, 60) - (isDeload ? 10 : 0);

    return {
      type: "run",
      title: "Fácil + técnica",
      targetMinutes,
      rpe: "3–4",
      details: [
        "10' suave",
        `${Math.max(15, targetMinutes - 15)} min fácil (ritmo conversación)`,
        "4× 15–20s strides (rápido controlado) con recuperación completa",
        "5' suave",
        "Extra: movilidad 5–10 min",
      ],
    };
  }

  if (dow === 4) {
    const isDeload = deloadWeek(w);

    // Thursday: quality changes by phase
    if (phase === "base") {
      return {
        type: "run",
        title: isDeload ? "Progresivo suave (descarga)" : "Intervalos cortos (suave)",
        targetMinutes: isDeload ? 40 : 45,
        rpe: "6",
        details: isDeload
          ? ["10' suave", "15–20' progresivo a RPE 5–6", "10' suave"]
          : ["10' suave", "6×(1' alegre RPE 6 / 2' suave)", "10' suave"],
      };
    }

    if (phase === "build") {
      return {
        type: "run",
        title: isDeload ? "Tempo suave (descarga)" : "Tempo por bloques",
        targetMinutes: isDeload ? 45 : 55,
        rpe: "6–7",
        details: isDeload
          ? ["10' suave", "2×6' RPE 6 / 3' suave", "10' suave"]
          : ["10' suave", "3×8' RPE 6–7 / 3' suave", "10' suave"],
      };
    }

    if (phase === "specific") {
      // alternate tempo and intervals every other week
      const tempoWeek = w % 2 === 1;
      return {
        type: "run",
        title: isDeload
          ? "Tempo controlado (descarga)"
          : tempoWeek
            ? "Tempo HM (controlado)"
            : "Intervalos (controlado)",
        targetMinutes: isDeload ? 50 : 60,
        rpe: isDeload ? "6" : "7–8",
        details: isDeload
          ? ["10' suave", "2×8' RPE 6 / 3' suave", "10' suave"]
          : tempoWeek
            ? ["10' suave", "3×10' RPE 7 / 3' suave", "10' suave"]
            : ["10' suave", "5×(3' RPE 8 / 2' suave)", "10' suave"],
      };
    }

    // taper
    return {
      type: "run",
      title: "Activación (taper)",
      targetMinutes: 40,
      rpe: "5–6",
      details: ["10' suave", "6×30s alegre / 90s suave", "10' suave"],
    };
  }

  if (dow === 0) {
    const isDeload = deloadWeek(w);

    // Sunday: long run progressive through phases
    const baseLong = phase === "base" ? 70 : phase === "build" ? 85 : phase === "specific" ? 100 : 75;
    const step = phase === "base" ? 5 : phase === "build" ? 5 : phase === "specific" ? 4 : 0;
    const phaseStartWeek = phase === "base" ? 1 : phase === "build" ? 5 : phase === "specific" ? 13 : 1;
    const targetMinutes = clamp(baseLong + (w - phaseStartWeek) * step, 60, 135) - (isDeload ? 15 : 0);

    const details: string[] = [`${Math.max(60, targetMinutes - 5)}–${targetMinutes} min fácil (ritmo conversación)`];

    if (phase === "specific" && !isDeload) {
      details.push("Últimos 15' a RPE 6–7 (controlado) si te sientes bien");
      details.push("Nutrición: agua + carbo si pasas 75–90'");
    } else {
      details.push("Si te cuesta: alterna 3' trote / 1' caminata");
    }

    return {
      type: "run",
      title: isDeload ? "Largo fácil (descarga)" : "Largo fácil",
      targetMinutes,
      rpe: "3–5",
      details,
    };
  }

  // Strength suggestion days: Mon(1) & Fri(5) with A/B rotation
  if (dow === 1 || dow === 5) {
    const workout = (w + (dow === 5 ? 1 : 0)) % 2 === 0 ? "A" : "B";

    return {
      type: "gym",
      title: `Fortalecimiento ${workout}`,
      targetMinutes: 35,
      details:
        workout === "A"
          ? [
              "Pierna + core (30–40 min)",
              "Sentadilla/prensa 3×6–10",
              "RDL 3×6–10",
              "Gemelos 3×10–15",
              "Core: plancha + dead bug (6–10 min)",
              "Si estás cansado: movilidad 10–15 min",
            ]
          : [
              "Glúteo + unilateral + core (30–40 min)",
              "Zancadas o split squat 3×8–12",
              "Hip thrust o puente 3×8–12",
              "Remo/espalda 3×8–12 (postura)",
              "Core: pallof press / side plank (6–10 min)",
              "Si estás cansado: movilidad 10–15 min",
            ],
    };
  }

  return {
    type: "rest",
    title: "Descanso / movilidad",
    details: ["Movilidad 10–15 min", "Caminata ligera opcional"],
  };
}

/**
 * Apply overrides on top of the algorithmic plan.
 * Overrides is a map of YYYY-MM-DD -> PlanOverride.
 */
export function planWithOverrides(
  date: Date,
  overrides: Record<string, { type: PlanItemType; title: string; targetMinutes?: number; rpe?: string; details: string[]; coachNote?: string }>,
): PlanItem {
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const override = overrides[key];
  if (override) {
    return {
      type: override.type,
      title: override.title,
      targetMinutes: override.targetMinutes,
      rpe: override.rpe,
      details: override.details,
      coachNote: override.coachNote,
      isOverride: true,
    };
  }
  return planForDate(date);
}
