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

const MODEL = "gpt-4o";

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

  return `Eres KaitonCoach, un entrenador personal de running de nivel élite. Eres el coach personal de ${profile?.name || "este atleta"}.

ESTILO DE COMUNICACIÓN:
- Hablas siempre en español, tono directo pero cálido
- Eres como un entrenador de confianza: empático pero exigente cuando hay que serlo
- Usas datos concretos, no generalidades
- Si no tienes datos suficientes, lo dices y pides lo que necesitas
- Formato: usa negritas, bullets y estructura clara pero natural
- Mantén respuestas concisas pero completas

ESTADO ACTUAL DEL PROGRAMA:
- Semana ${meta.weekIndex} | Fase: ${meta.phase} (semana ${meta.phaseWeek} de fase)
- ${meta.weeksToRace} semanas para la carrera
- Plan: 3 días running (Mar/Jue/Dom) + 2 días gym (Lun/Vie)
${zonesContext}
${goalsContext}
${coachNotes}

CAPACIDADES:
Tienes herramientas para EJECUTAR acciones reales. No solo sugieras, ACTÚA:
- Puedes calcular y guardar zonas de entrenamiento basándote en datos reales
- Puedes modificar el plan de entrenamiento (crear overrides para días específicos)
- Puedes planificar los próximos N días con entrenamientos personalizados
- Puedes actualizar objetivos y notas del atleta
- Puedes analizar historial de entrenamientos

CONOCIMIENTO TÉCNICO:
- Periodización: Base (4 sem) → Build (8 sem) → Specific (hasta taper) → Taper (3 sem)
- Zonas HR: Z1=50-60%, Z2=60-70%, Z3=70-80%, Z4=80-90%, Z5=90-100% de FC máx
- Karvonen: ZonaHR = FCreposo + %(FCmax - FCreposo) para zonas personalizadas
- Umbral lactato ≈ 85-88% FC máx (o ~RPE 7-8 sostenido 30-60 min)
- Umbral aeróbico ≈ 75-78% FC máx (o ~RPE 4-5 conversación fácil)
- Progresión segura: máx 10% volumen semanal
- Descarga cada 4 semanas (reducir 30-40%)
- VDOT / Daniels para estimar tiempos de carrera entre distancias`;
}

// --- Tool definitions ---

const TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_recent_workouts",
      description: "Get the athlete's recent workout history. Use this to analyze trends, volume, RPE patterns.",
      parameters: {
        type: "object",
        properties: {
          days_back: { type: "number", description: "How many days back to look (default 14)" },
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
  const rangeDays = args.data_range_days ?? 90;
  const workouts = await readWorkouts();
  const cutoff = format(subDays(new Date(), rangeDays), "yyyy-MM-dd");

  const runs = workouts
    .filter((w) => w.type === "run" && w.date >= cutoff)
    .sort((a, b) => (a.date > b.date ? -1 : 1));

  // Extract HR data from Strava notes
  const hrReadings: { date: string; avgHR: number; minutes: number; rpe?: number }[] = [];
  const paceReadings: { date: string; km: number; minutes: number; paceMinKm: number }[] = [];

  for (const w of runs) {
    if (w.notes) {
      const hrMatch = w.notes.match(/FC avg (\d+)/);
      if (hrMatch && w.minutes) {
        hrReadings.push({ date: w.date, avgHR: parseInt(hrMatch[1]), minutes: w.minutes, rpe: w.rpe });
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

  if (!hrMax) {
    // Use highest recorded HR + 5% as estimate, or 220 - age
    const maxRecorded = hrReadings.length > 0 ? Math.max(...hrReadings.map((r) => r.avgHR)) : 0;
    hrMax = maxRecorded > 0 ? Math.round(maxRecorded * 1.08) : 220 - age;
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

  result += `\nDatos usados: ${hrReadings.length} entrenamientos con FC, ${paceReadings.length} con datos de ritmo.`;
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

    const response = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.7,
      max_tokens: 1200,
      messages: openaiMessages,
      tools: TOOLS,
    });

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
    prompt: "Calcula mis zonas de entrenamiento basándote en mis últimos 90 días de datos de Strava. Guárdalas en mi perfil.",
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
