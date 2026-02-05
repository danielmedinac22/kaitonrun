import { differenceInCalendarDays, parseISO } from "date-fns";

export type PlanItemType = "run" | "gym" | "rest";

export type PlanItem = {
  type: PlanItemType;
  title: string;
  targetMinutes?: number;
  rpe?: string;
  details: string[];
};

// Program start date (first week anchor)
const START_DATE = process.env.NEXT_PUBLIC_PLAN_START_DATE || "2026-02-05";

export function programWeekIndex(date: Date): number {
  const start = parseISO(START_DATE);
  const days = differenceInCalendarDays(date, start);
  return Math.max(1, Math.floor(days / 7) + 1);
}

export function planForDate(date: Date): PlanItem {
  const dow = date.getDay(); // 0 Sun
  const w = programWeekIndex(date);

  // Planned running days: Tue (2), Thu (4), Sun (0)
  if (dow === 2) {
    // Easy + technique
    if (w <= 2) {
      return {
        type: "run",
        title: "Fácil + técnica",
        targetMinutes: w === 1 ? 35 : 45,
        rpe: "3–4",
        details: [
          "10' suave",
          `${w === 1 ? "20–25" : "25–35"} min fácil (ritmo conversación)` ,
          "4× 15–20s strides (rápido controlado) con recuperación completa",
          "5' suave",
        ],
      };
    }
    return {
      type: "run",
      title: "Fácil + técnica",
      targetMinutes: w === 3 ? 50 : 40,
      rpe: "3–4",
      details: [
        "35–55 min fácil (ritmo conversación)",
        "4× 15–20s strides opcional",
        "Movilidad 5–10 min",
      ],
    };
  }

  if (dow === 4) {
    // Quality (controlled)
    if (w === 1) {
      return {
        type: "run",
        title: "Intervalos cortos (suave)",
        targetMinutes: 45,
        rpe: "6",
        details: ["10' suave", "6×(1' alegre RPE 6 / 2' suave)", "10' suave"],
      };
    }
    if (w === 2) {
      return {
        type: "run",
        title: "Tempo por bloques",
        targetMinutes: 50,
        rpe: "6",
        details: ["10' suave", "3×6' RPE 6 / 3' suave", "10' suave"],
      };
    }
    if (w === 3) {
      return {
        type: "run",
        title: "Intervalos cortos (controlado)",
        targetMinutes: 55,
        rpe: "7",
        details: ["10' suave", "8×(1' RPE 7 / 2' suave)", "10' suave"],
      };
    }
    // week 4 deload
    return {
      type: "run",
      title: "Tempo suave (descarga)",
      targetMinutes: 45,
      rpe: "6",
      details: ["10' suave", "2×6' RPE 6 / 3' suave", "10' suave"],
    };
  }

  if (dow === 0) {
    // Long run
    if (w === 1) {
      return {
        type: "run",
        title: "Largo fácil",
        targetMinutes: 70,
        rpe: "3–4",
        details: ["60–75 min fácil (ritmo conversación)", "Si te cuesta: alterna 3' trote / 1' caminata"],
      };
    }
    if (w === 2) {
      return {
        type: "run",
        title: "Largo fácil",
        targetMinutes: 80,
        rpe: "3–4",
        details: ["70–90 min fácil", "Últimos 10' un poco más alegres (opcional)"],
      };
    }
    if (w === 3) {
      return {
        type: "run",
        title: "Largo fácil",
        targetMinutes: 90,
        rpe: "3–4",
        details: ["80–100 min fácil", "Nutrición: agua + algo ligero si pasas 75'"],
      };
    }
    return {
      type: "run",
      title: "Largo fácil (descarga)",
      targetMinutes: 75,
      rpe: "3–4",
      details: ["60–80 min fácil", "Movilidad 10 min"],
    };
  }

  // Strength suggestion days: Mon(1) & Fri(5)
  if (dow === 1 || dow === 5) {
    return {
      type: "gym",
      title: "Fortalecimiento",
      targetMinutes: 30,
      details: [
        "Pierna + core (20–35 min)",
        "Sentadilla/prensa + RDL + zancadas + gemelos",
        "Si estás cansado: solo movilidad 10–15 min",
      ],
    };
  }

  return {
    type: "rest",
    title: "Descanso / movilidad",
    details: ["Movilidad 10–15 min", "Caminata ligera opcional"],
  };
}
