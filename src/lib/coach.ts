import OpenAI from "openai";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
import { format, subDays, addDays, parseISO } from "date-fns";

import { readWorkouts } from "@/lib/workouts";
import { planForDate, programMeta } from "@/lib/plan";
import type { ProgramMeta } from "@/lib/plan";
import {
  loadProfile,
  saveProfile,
  loadOverrides,
  saveOverrides,
  type AthleteProfile,
  type TrainingZones,
} from "@/lib/athlete";

// --- Client ---

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing env var: OPENAI_API_KEY");
  return new OpenAI({ apiKey });
}

const MODEL = "gpt-5.2";

// --- System prompt ---

function buildSystemPrompt(profile: AthleteProfile | null, meta: ProgramMeta): string {
  const zonesContext = profile?.zones
    ? `
ZONAS DE ENTRENAMIENTO DEL ATLETA (calculadas ${profile.zones.calculated_at}):
- FC máx: ${profile.zones.hr_max} bpm | FC reposo: ${profile.zones.hr_rest} bpm
- Z1 (recuperación): ${profile.zones.hr_zones.z1.min}-${profile.zones.hr_zones.z1.max} bpm
- Z2 (aeróbico): ${profile.zones.hr_zones.z2.min}-${profile.zones.hr_zones.z2.max} bpm
- Z3 (tempo): ${profile.zones.hr_zones.z3.min}-${profile.zones.hr_zones.z3.max} bpm
- Z4 (umbral): ${profile.zones.hr_zones.z4.min}-${profile.zones.hr_zones.z4.max} bpm
- Z5 (VO2max): ${profile.zones.hr_zones.z5.min}-${profile.zones.hr_zones.z5.max} bpm
- Umbral de lactato: ${profile.zones.lactate_threshold_hr} bpm
- Umbral aeróbico: ${profile.zones.aerobic_threshold_hr} bpm
${profile.zones.pace_zones ? `- Zonas de ritmo: Fácil ${profile.zones.pace_zones.easy} | Tempo ${profile.zones.pace_zones.tempo} | Umbral ${profile.zones.pace_zones.threshold} | Intervalo ${profile.zones.pace_zones.interval}` : ""}`
    : "ZONAS: No calculadas aún. Si el atleta pregunta, usa la herramienta calculate_and_save_zones.";

  const goalsContext = profile?.goals
    ? `
OBJETIVOS DEL ATLETA:
- Carrera: ${profile.goals.race_distance} el ${profile.goals.race_date}
${profile.goals.target_time ? `- Tiempo objetivo: ${profile.goals.target_time}` : ""}
${profile.goals.five_k_target ? `- Objetivo 5K: ${profile.goals.five_k_target}` : ""}
${profile.goals.ten_k_target ? `- Objetivo 10K: ${profile.goals.ten_k_target}` : ""}`
    : "";

  const coachNotes = profile?.coach_notes
    ? `\nNOTAS PREVIAS DEL COACH:\n${profile.coach_notes}`
    : "";

  return `Eres KaitonCoach, un entrenador de running con más de 30 años de experiencia entrenando atletas de todos los niveles — desde principiantes que completan su primer 5K hasta corredores sub-3h en maratón. Eres el coach personal de ${profile?.name || "este atleta"}.

TU EXPERIENCIA Y FILOSOFÍA:
- Has entrenado a cientos de corredores para media maratón y maratón durante 3 décadas
- Tu enfoque combina la ciencia moderna del entrenamiento (Seiler, Esteve-Lanao, Jack Daniels, Peter Coe, Lydiard) con la intuición práctica que solo da la experiencia
- Crees firmemente en la distribución polarizada del entrenamiento: ~80% en Z1-Z2 y ~20% en Z4-Z5, con mínimo tiempo en Z3 ("zona gris")
- Sabes que la consistencia supera a la intensidad: mejor 5 entrenamientos moderados que 3 brutales
- Entiendes que cada atleta es diferente: la misma carga puede ser recuperación para uno y sobreentrenamiento para otro
- Siempre consideras el estrés total del atleta (trabajo, sueño, vida personal) en tus prescripciones

ESTILO DE COMUNICACIÓN:
- Hablas siempre en español, tono directo pero cálido — como un mentor de confianza
- Eres empático pero exigente cuando hay que serlo. No endulzas la verdad
- SIEMPRE usas datos concretos del historial del atleta, nunca generalidades vacías
- Si te faltan datos, lo dices claro y pides lo que necesitas
- Formato: usa **negritas**, bullets y estructura clara. Sé conciso pero completo
- Cuando das un consejo, explicas brevemente el POR QUÉ fisiológico detrás

ESTADO ACTUAL DEL PROGRAMA:
- Semana ${meta.weekIndex} | Fase: ${meta.phase} (semana ${meta.phaseWeek} de fase)
- ${meta.weeksToRace} semanas para la carrera
- Plan: 3 días running (Mar/Jue/Dom) + 2 días gym (Lun/Vie)
${zonesContext}
${goalsContext}
${coachNotes}

CAPACIDADES — ERES UN COACH QUE ACTÚA:
No solo sugieras, EJECUTA con tus herramientas:
- Calcula y guarda zonas de entrenamiento con datos reales del atleta (usa 365 días de historial para mayor precisión)
- Modifica el plan de entrenamiento creando overrides para días específicos
- Planifica próximos N días con entrenamientos personalizados y progresión lógica
- Actualiza objetivos y notas del atleta para persistir contexto entre sesiones
- Analiza historial de entrenamientos para detectar patrones, sobreentrenamiento, progresión

ANTES DE RESPONDER:
1. Siempre consulta el historial reciente (get_recent_workouts) para basar tu análisis en datos reales
2. Si hablas de zonas, verifica que estén calculadas o calcúlalas con datos reales
3. Si modificas el plan, justifica cada cambio con lógica de periodización
4. Si ves señales de riesgo (RPE creciente, ritmo estancado, FC en reposo alta), alerta al atleta

CONOCIMIENTO TÉCNICO PROFUNDO:

Periodización:
- Base (4 sem): Construir volumen aeróbico. 80-85% Z1-Z2. Long run progresivo hasta 90min. Foco en técnica y cadencia
- Build (8 sem): Introducir tempo e intervalos. Sesión clave 1: Tempo (Z3-Z4). Sesión clave 2: Intervalos (Z4-Z5). Long run con segmentos a ritmo objetivo
- Specific (variable): Simular demandas de la carrera. Long runs con últimos km a race pace. Intervalos específicos a ritmo media maratón. Reducir volumen de gym gradualmente
- Taper (3 sem): Reducir volumen 40-50-60% cada semana MANTENIENDO intensidad. No introducir estímulos nuevos. Priorizar sueño y nutrición

Fisiología aplicada:
- Umbral aeróbico (VT1/AeT): ~75-78% FCmax, ritmo conversacional, base de todo el entrenamiento
- Umbral de lactato (VT2/LT): ~85-88% FCmax, máximo estado estable de lactato, ritmo sostenible ~60min
- VO2max: ~92-97% FCmax, máximo consumo de oxígeno, intervalos de 3-5min
- Economía de carrera: mejora con strides, fuerza específica, técnica — no solo volumen
- Supercompensación: el cuerpo necesita 48-72h para adaptarse a estímulos duros
- Carga aguda:crónica (ratio): mantener entre 0.8-1.3 para progresión segura sin lesiones

Zonas de entrenamiento:
- Karvonen: ZonaHR = FCreposo + %(FCmax - FCreposo)
- Z1 (Recuperación activa): 50-60% HRR — paseos, trote muy suave, día después de sesión dura
- Z2 (Aeróbico / Resistencia): 60-70% HRR — la zona MÁS IMPORTANTE, donde se construye la base
- Z3 (Tempo / Zona gris): 70-80% HRR — usar con moderación, fatiga alta con poco beneficio específico
- Z4 (Umbral): 80-90% HRR — intervalos de 8-20min, mejora LT, 1-2x/semana máximo
- Z5 (VO2max): 90-100% HRR — intervalos de 2-5min, mejora capacidad máxima, solo en fase Build/Specific
- Distribución ideal: 80/20 polarizada (80% Z1-Z2, 20% Z4-Z5)

Prevención de lesiones:
- Regla del 10%: no aumentar volumen semanal más del 10%
- Semana de descarga cada 3-4 semanas: reducir 30-40% de volumen manteniendo intensidad
- Cadencia ideal: 170-185 spm reduce impacto por paso
- Trabajo de fuerza: sentadillas, peso muerto, step-ups, core — no negociable para corredores
- Señales de alarma: RPE creciente para mismo ritmo, FC en reposo elevada, fatiga residual >48h, dolor articular

Estimación de rendimiento (Daniels/VDOT):
- 5K → Media: multiplicar por ~4.65
- 10K → Media: multiplicar por ~2.22
- Los tiempos reales dependen de entrenamiento específico de distancia
- Negativos split: la segunda mitad debería ser igual o más rápida (1-2% más rápido = carrera perfecta)

Nutrición carrera (guías generales):
- Long runs >75min: considerar geles/carbohidratos en carrera (30-60g/h)
- Pre-carrera: 2-3h antes, comida rica en carbohidratos simples, baja en fibra
- Hidratación: practicar en entrenamientos, no experimentar el día de carrera
- Carga de carbohidratos: 3 días antes (7-10g/kg/día) solo para media maratón y mayores`;
}

// --- Tool definitions ---

const TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_recent_workouts",
      description: "Get the athlete's workout history. Use this to analyze trends, volume, RPE patterns. Use larger ranges (90-365) for zone calculations and long-term trend analysis.",
      parameters: {
        type: "object",
        properties: {
          days_back: { type: "number", description: "How many days back to look (default 14, max 365)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_upcoming_plan",
      description: "Get the planned workouts for the next N days (including any coach overrides).",
      parameters: {
        type: "object",
        properties: {
          days_ahead: { type: "number", description: "How many days ahead to show (default 7)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "calculate_and_save_zones",
      description: "Calculate training zones (HR, pace, thresholds) from recent workout data and save them to the athlete's profile. Call this when the athlete asks about zones or when you need zone data to give coaching advice.",
      parameters: {
        type: "object",
        properties: {
          data_range_days: { type: "number", description: "Days of data to analyze (90, 180, or 365)" },
          age: { type: "number", description: "Athlete's age if known" },
          resting_hr: { type: "number", description: "Resting heart rate if known" },
          max_hr: { type: "number", description: "Max heart rate if known (overrides estimate)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "modify_plan",
      description: "Override the training plan for specific dates. Use this to adjust workouts based on performance, fatigue, goals. This ACTUALLY changes what the athlete sees in their plan.",
      parameters: {
        type: "object",
        properties: {
          overrides: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date: { type: "string", description: "YYYY-MM-DD" },
                type: { type: "string", enum: ["run", "gym", "rest"] },
                title: { type: "string", description: "Workout title in Spanish" },
                targetMinutes: { type: "number" },
                rpe: { type: "string", description: "Target RPE e.g. '6-7'" },
                details: {
                  type: "array",
                  items: { type: "string" },
                  description: "Step-by-step workout instructions in Spanish",
                },
                coachNote: { type: "string", description: "Why this change was made" },
              },
              required: ["date", "type", "title", "details"],
            },
          },
        },
        required: ["overrides"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_athlete_goals",
      description: "Update the athlete's race goals, target times, etc. This persists across sessions.",
      parameters: {
        type: "object",
        properties: {
          race_date: { type: "string" },
          race_distance: { type: "string" },
          target_time: { type: "string", description: "Target finish time e.g. '1:45:00'" },
          five_k_target: { type: "string", description: "Current or target 5K time" },
          ten_k_target: { type: "string", description: "Current or target 10K time" },
          notes: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "save_coach_notes",
      description: "Save persistent notes about the athlete (injuries, preferences, observations). These notes are included in future conversations so you remember context.",
      parameters: {
        type: "object",
        properties: {
          notes: { type: "string", description: "Coach notes to persist (replaces previous notes)" },
        },
        required: ["notes"],
      },
    },
  },
];

// --- Tool implementations ---

async function toolGetRecentWorkouts(args: { days_back?: number }): Promise<string> {
  const daysBack = args.days_back ?? 14;
  const workouts = await readWorkouts();
  const cutoff = format(subDays(new Date(), daysBack), "yyyy-MM-dd");
  const recent = workouts
    .filter((w) => w.date >= cutoff)
    .sort((a, b) => (a.date > b.date ? -1 : 1));

  if (recent.length === 0) return "No hay entrenamientos en los últimos " + daysBack + " días.";

  const totalMin = recent.reduce((s, w) => s + (w.minutes ?? 0), 0);
  const runs = recent.filter((w) => w.type === "run");
  const gym = recent.filter((w) => w.type === "gym");
  const rpes = recent.filter((w) => w.rpe).map((w) => w.rpe!);
  const avgRpe = rpes.length > 0 ? (rpes.reduce((a, b) => a + b, 0) / rpes.length).toFixed(1) : "N/A";

  let result = `ÚLTIMOS ${daysBack} DÍAS (${recent.length} entrenamientos):\n`;
  result += `Resumen: ${totalMin} min total | ${runs.length} runs + ${gym.length} gym | RPE promedio: ${avgRpe}\n\n`;

  for (const w of recent) {
    const planned = planForDate(parseISO(w.date));
    const matchesPlan = planned.type === w.type;
    result += `${w.date} | ${w.type} | ${w.minutes ?? "?"}min | RPE ${w.rpe ?? "?"}/10`;
    result += ` | Plan: ${planned.title} (${matchesPlan ? "cumplido" : "CAMBIADO"})`;
    if (w.notes) result += ` | ${w.notes}`;
    if (w.source) result += ` [${w.source}]`;
    result += "\n";
  }

  return result;
}

async function toolGetUpcomingPlan(args: { days_ahead?: number }): Promise<string> {
  const daysAhead = args.days_ahead ?? 7;
  const today = new Date();
  const overrides = await loadOverrides();

  let result = `PLAN PRÓXIMOS ${daysAhead} DÍAS:\n`;
  for (let i = 0; i < daysAhead; i++) {
    const d = addDays(today, i);
    const key = format(d, "yyyy-MM-dd");
    const override = overrides[key];
    const plan = override
      ? { type: override.type, title: override.title, targetMinutes: override.targetMinutes, rpe: override.rpe, details: override.details, isOverride: true, coachNote: override.coachNote }
      : planForDate(d);

    const dow = format(d, "EEE");
    result += `${key} (${dow}) | ${plan.type} | ${plan.title}`;
    if (plan.targetMinutes) result += ` | ${plan.targetMinutes}min`;
    if (plan.rpe) result += ` | RPE ${plan.rpe}`;
    if ("isOverride" in plan && plan.isOverride) result += " [OVERRIDE del coach]";
    if ("coachNote" in plan && plan.coachNote) result += ` | Nota: ${plan.coachNote}`;
    result += "\n";
  }
  return result;
}

async function toolCalculateAndSaveZones(args: {
  data_range_days?: number;
  age?: number;
  resting_hr?: number;
  max_hr?: number;
}): Promise<string> {
  const rangeDays = args.data_range_days ?? 365;
  const workouts = await readWorkouts();
  const cutoff = format(subDays(new Date(), rangeDays), "yyyy-MM-dd");

  const runs = workouts
    .filter((w) => w.type === "run" && w.date >= cutoff)
    .sort((a, b) => (a.date > b.date ? -1 : 1));

  // Extract HR data from Strava notes
  const hrReadings: { date: string; avgHR: number; minutes: number; rpe?: number }[] = [];
  const paceReadings: { date: string; km: number; minutes: number; paceMinKm: number }[] = [];

  const maxHrReadings: number[] = [];

  for (const w of runs) {
    if (w.notes) {
      const hrMatch = w.notes.match(/FC avg (\d+)/);
      if (hrMatch && w.minutes) {
        hrReadings.push({ date: w.date, avgHR: parseInt(hrMatch[1]), minutes: w.minutes, rpe: w.rpe });
      }
      const maxHrMatch = w.notes.match(/FC max (\d+)/);
      if (maxHrMatch) {
        maxHrReadings.push(parseInt(maxHrMatch[1]));
      }
      const paceMatch = w.notes.match(/([\d.]+)\s*km/);
      if (paceMatch && w.minutes) {
        const km = parseFloat(paceMatch[1]);
        if (km > 0) {
          paceReadings.push({ date: w.date, km, minutes: w.minutes, paceMinKm: w.minutes / km });
        }
      }
    }
  }

  // Estimate max HR
  const profile = await loadProfile() || { updated_at: new Date().toISOString() };
  let hrMax = args.max_hr ?? 0;
  const hrRest = args.resting_hr ?? 60;
  const age = args.age ?? profile.age ?? 30;

  const highestMaxHr = maxHrReadings.length > 0 ? Math.max(...maxHrReadings) : 0;
  const highestAvgHr = hrReadings.length > 0 ? Math.max(...hrReadings.map((r) => r.avgHR)) : 0;

  if (!hrMax) {
    if (highestMaxHr > 0) {
      // Use actual recorded max HR + small buffer for true max
      hrMax = Math.round(highestMaxHr * 1.03);
    } else if (highestAvgHr > 0) {
      hrMax = Math.round(highestAvgHr * 1.08);
    } else {
      hrMax = 220 - age;
    }
  }

  // Karvonen method for personalized zones
  const hrr = hrMax - hrRest; // Heart Rate Reserve
  const karvonen = (low: number, high: number) => ({
    min: Math.round(hrRest + hrr * low),
    max: Math.round(hrRest + hrr * high),
  });

  const zones: TrainingZones = {
    hr_max: hrMax,
    hr_rest: hrRest,
    hr_zones: {
      z1: karvonen(0.5, 0.6),
      z2: karvonen(0.6, 0.7),
      z3: karvonen(0.7, 0.8),
      z4: karvonen(0.8, 0.9),
      z5: karvonen(0.9, 1.0),
    },
    lactate_threshold_hr: Math.round(hrRest + hrr * 0.88),
    aerobic_threshold_hr: Math.round(hrRest + hrr * 0.75),
    calculated_at: format(new Date(), "yyyy-MM-dd"),
    data_range_days: rangeDays,
  };

  // Estimate pace zones from data
  if (paceReadings.length >= 3) {
    const sorted = [...paceReadings].sort((a, b) => a.paceMinKm - b.paceMinKm);
    const fastest = sorted[0].paceMinKm;
    const easyPace = sorted[sorted.length - 1].paceMinKm;

    const fmtPace = (p: number) => `${Math.floor(p)}:${String(Math.round((p % 1) * 60)).padStart(2, "0")}`;

    zones.pace_zones = {
      easy: `${fmtPace(easyPace * 0.95)}-${fmtPace(easyPace * 1.05)}`,
      tempo: `${fmtPace(fastest * 1.1)}-${fmtPace(fastest * 1.2)}`,
      threshold: `${fmtPace(fastest * 1.0)}-${fmtPace(fastest * 1.1)}`,
      interval: `${fmtPace(fastest * 0.9)}-${fmtPace(fastest * 1.0)}`,
      sprint: `< ${fmtPace(fastest * 0.9)}`,
    };
  }

  // Save to profile
  profile.zones = zones;
  if (age) profile.age = age;
  await saveProfile(profile);

  // Build response
  let result = `ZONAS CALCULADAS Y GUARDADAS (últimos ${rangeDays} días, ${runs.length} runs, ${hrReadings.length} con datos de FC):\n\n`;
  result += `FC máx: ${zones.hr_max} bpm | FC reposo: ${zones.hr_rest} bpm\n`;
  result += `Umbral aeróbico (VT1): ${zones.aerobic_threshold_hr} bpm\n`;
  result += `Umbral de lactato (VT2): ${zones.lactate_threshold_hr} bpm\n\n`;
  result += `Z1 (Recuperación): ${zones.hr_zones.z1.min}-${zones.hr_zones.z1.max} bpm\n`;
  result += `Z2 (Aeróbico): ${zones.hr_zones.z2.min}-${zones.hr_zones.z2.max} bpm\n`;
  result += `Z3 (Tempo): ${zones.hr_zones.z3.min}-${zones.hr_zones.z3.max} bpm\n`;
  result += `Z4 (Umbral): ${zones.hr_zones.z4.min}-${zones.hr_zones.z4.max} bpm\n`;
  result += `Z5 (VO2max): ${zones.hr_zones.z5.min}-${zones.hr_zones.z5.max} bpm\n`;

  if (zones.pace_zones) {
    result += `\nZonas de ritmo:\n`;
    result += `Fácil: ${zones.pace_zones.easy} min/km\n`;
    result += `Tempo: ${zones.pace_zones.tempo} min/km\n`;
    result += `Umbral: ${zones.pace_zones.threshold} min/km\n`;
    result += `Intervalo: ${zones.pace_zones.interval} min/km\n`;
  }

  result += `\nDatos usados: ${runs.length} runs analizados, ${hrReadings.length} con FC promedio, ${maxHrReadings.length} con FC máx, ${paceReadings.length} con datos de ritmo.`;
  if (highestMaxHr > 0) {
    result += `\nFC máx basada en lectura real de Strava: ${highestMaxHr} bpm (+ 3% margen = ${hrMax} bpm).`;
  }
  result += `\nEstas zonas ya están guardadas en tu perfil y las usaré en todas las conversaciones futuras.`;

  return result;
}

async function toolModifyPlan(args: {
  overrides: {
    date: string;
    type: string;
    title: string;
    targetMinutes?: number;
    rpe?: string;
    details: string[];
    coachNote?: string;
  }[];
}): Promise<string> {
  const existing = await loadOverrides();

  for (const o of args.overrides) {
    existing[o.date] = {
      type: o.type as "run" | "gym" | "rest",
      title: o.title,
      targetMinutes: o.targetMinutes,
      rpe: o.rpe,
      details: o.details,
      coachNote: o.coachNote,
      created_at: new Date().toISOString(),
    };
  }

  await saveOverrides(existing);

  const dates = args.overrides.map((o) => o.date).join(", ");
  return `Plan modificado para ${args.overrides.length} día(s): ${dates}. Los cambios ya son visibles en la app.`;
}

async function toolUpdateGoals(args: {
  race_date?: string;
  race_distance?: string;
  target_time?: string;
  five_k_target?: string;
  ten_k_target?: string;
  notes?: string;
}): Promise<string> {
  const profile = await loadProfile() || { updated_at: new Date().toISOString() };
  profile.goals = {
    race_date: args.race_date ?? profile.goals?.race_date ?? "2026-09-13",
    race_distance: args.race_distance ?? profile.goals?.race_distance ?? "21.1km",
    target_time: args.target_time ?? profile.goals?.target_time,
    five_k_target: args.five_k_target ?? profile.goals?.five_k_target,
    ten_k_target: args.ten_k_target ?? profile.goals?.ten_k_target,
    notes: args.notes ?? profile.goals?.notes,
  };
  await saveProfile(profile);

  return `Objetivos actualizados: ${JSON.stringify(profile.goals, null, 2)}`;
}

async function toolSaveCoachNotes(args: { notes: string }): Promise<string> {
  const profile = await loadProfile() || { updated_at: new Date().toISOString() };
  profile.coach_notes = args.notes;
  await saveProfile(profile);
  return "Notas del coach guardadas. Las tendré en cuenta en futuras conversaciones.";
}

// --- Execute tool calls ---

async function executeTool(name: string, argsJson: string): Promise<string> {
  const args = JSON.parse(argsJson);
  switch (name) {
    case "get_recent_workouts":
      return toolGetRecentWorkouts(args);
    case "get_upcoming_plan":
      return toolGetUpcomingPlan(args);
    case "calculate_and_save_zones":
      return toolCalculateAndSaveZones(args);
    case "modify_plan":
      return toolModifyPlan(args);
    case "update_athlete_goals":
      return toolUpdateGoals(args);
    case "save_coach_notes":
      return toolSaveCoachNotes(args);
    default:
      return `Unknown tool: ${name}`;
  }
}

// --- Main chat function ---

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function chat(
  messages: ChatMessage[],
): Promise<{ reply: string; toolsUsed: string[] }> {
  const client = getClient();
  const today = new Date();
  const meta = programMeta(today);
  const profile = await loadProfile();

  const systemPrompt = buildSystemPrompt(profile, meta);
  const toolsUsed: string[] = [];

  // Build OpenAI messages
  const openaiMessages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  // Agentic loop: keep calling until no more tool calls
  let iterations = 0;
  const MAX_ITERATIONS = 8;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await client.chat.completions.create({
      model: MODEL,
      max_completion_tokens: 4000,
      reasoning_effort: "medium",
      messages: openaiMessages,
      tools: TOOLS,
    } as any);

    const choice = response.choices[0];
    const message = choice.message;

    // If no tool calls, we have the final response
    if (!message.tool_calls || message.tool_calls.length === 0) {
      return {
        reply: message.content || "...",
        toolsUsed,
      };
    }

    // Process tool calls
    openaiMessages.push(message);

    for (const toolCall of message.tool_calls) {
      if (toolCall.type !== "function") continue;
      const toolName = toolCall.function.name;
      toolsUsed.push(toolName);

      let toolResult: string;
      try {
        toolResult = await executeTool(toolName, toolCall.function.arguments);
      } catch (e) {
        toolResult = `Error executing ${toolName}: ${e instanceof Error ? e.message : "unknown error"}`;
      }

      openaiMessages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: toolResult,
      });
    }
  }

  // If we exhausted iterations, return last assistant message
  return {
    reply: "He procesado varios pasos. ¿Necesitas algo más?",
    toolsUsed,
  };
}

// --- Quick actions ---

export const QUICK_ACTIONS = [
  {
    id: "plan_next_15",
    label: "Planear próximos 15 días",
    prompt: "Planifica mis próximos 15 días de entrenamiento. Revisa mi historial reciente, mi fase actual y ajusta el plan con entrenamientos específicos. Modifica el plan directamente.",
  },
  {
    id: "analyze_last",
    label: "Analizar último entrenamiento",
    prompt: "Analiza mi último entrenamiento. ¿Cómo estuvo? ¿Cumplí el plan? ¿Qué debo ajustar?",
  },
  {
    id: "calculate_zones",
    label: "Calcular mis zonas",
    prompt: "Calcula mis zonas de entrenamiento basándote en mis últimos 365 días de datos de Strava para máxima precisión. Guárdalas en mi perfil.",
  },
  {
    id: "weekly_review",
    label: "Revisión semanal",
    prompt: "Dame una revisión completa de mi semana: cumplimiento, carga, tendencia, y qué ajustar para la próxima semana.",
  },
  {
    id: "adjust_week",
    label: "Ajustar esta semana",
    prompt: "Basándote en cómo me ha ido, ajusta los entrenamientos restantes de esta semana. Modifica el plan directamente.",
  },
  {
    id: "race_readiness",
    label: "¿Cómo voy para la carrera?",
    prompt: "Evalúa mi preparación para la media maratón. ¿Voy bien? ¿En cuánto tiempo debería correr los 5K y 10K según mi nivel actual? ¿Qué me falta?",
  },
];
