import OpenAI from "openai";
import type { Workout } from "@/lib/workouts";
import type { PlanItem, ProgramMeta } from "@/lib/plan";

// --- Client ---

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing env var: OPENAI_API_KEY");
  return new OpenAI({ apiKey });
}

const MODEL = "gpt-4o-mini";

// --- System prompt ---

const COACH_SYSTEM = `Eres KaitonCoach, un entrenador personal experto en running y preparación de media maratón.

PERFIL DEL ATLETA:
- Preparando una media maratón (21.1 km)
- Entrena 3 días running (Mar/Jue/Dom) + 2 días gym (Lun/Vie)
- Fases de entrenamiento: Base → Build → Specific → Taper
- Usa RPE (Rate of Perceived Exertion) escala 1-10

TU ESTILO:
- Directo, motivador pero realista
- Basado en ciencia del deporte (periodización, supercompensación, umbrales)
- Responde siempre en español
- Usa datos concretos del atleta, no generalidades
- Si detectas señales de sobreentrenamiento, alerta inmediatamente
- Formato: usa bullets, negritas y estructura clara
- Mantén respuestas concisas (máx 300 palabras)

CONOCIMIENTO TÉCNICO:
- Zonas de frecuencia cardíaca: Z1 (50-60%), Z2 (60-70%), Z3 (70-80%), Z4 (80-90%), Z5 (90-100%)
- Umbral de lactato aprox. 85-88% FC máx
- Umbral aeróbico aprox. 75-78% FC máx
- FC máx estimada: 220 - edad (o mejor con datos reales)
- Relación RPE-Zona: RPE 3-4 = Z2, RPE 5-6 = Z3, RPE 7-8 = Z4, RPE 9-10 = Z5
- Progresión segura de volumen: máx 10% semanal
- Descarga cada 4 semanas (reducir 30-40% volumen)`;

// --- Helper: format workout data for context ---

function formatWorkout(w: Workout): string {
  const parts = [`Fecha: ${w.date}`, `Tipo: ${w.type}`];
  if (w.minutes) parts.push(`Duración: ${w.minutes} min`);
  if (w.rpe) parts.push(`RPE: ${w.rpe}/10`);
  if (w.notes) parts.push(`Notas: ${w.notes}`);
  if (w.source) parts.push(`Fuente: ${w.source}`);
  return parts.join(" | ");
}

function formatPlan(p: PlanItem): string {
  const parts = [`Tipo: ${p.type}`, `Título: ${p.title}`];
  if (p.targetMinutes) parts.push(`Objetivo: ${p.targetMinutes} min`);
  if (p.rpe) parts.push(`RPE objetivo: ${p.rpe}`);
  if (p.details.length) parts.push(`Detalles: ${p.details.join("; ")}`);
  return parts.join(" | ");
}

function formatMeta(m: ProgramMeta): string {
  return `Semana ${m.weekIndex} | Fase: ${m.phase} (semana ${m.phaseWeek} de fase) | ${m.weeksToRace} semanas para la carrera`;
}

// --- Coaching Functions ---

export type CoachResponse = {
  message: string;
  type: "analysis" | "briefing" | "weekly" | "zones" | "adjustment";
};

/**
 * Analyze a completed workout: performance feedback, recovery tips, what went well/could improve.
 */
export async function analyzeWorkout(
  workout: Workout,
  planned: PlanItem,
  meta: ProgramMeta,
  recentWorkouts: Workout[],
): Promise<CoachResponse> {
  const client = getClient();

  const recentContext = recentWorkouts.length > 0
    ? `\n\nÚLTIMOS ENTRENAMIENTOS (más reciente primero):\n${recentWorkouts.map(formatWorkout).join("\n")}`
    : "";

  const response = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.7,
    max_tokens: 500,
    messages: [
      { role: "system", content: COACH_SYSTEM },
      {
        role: "user",
        content: `Analiza este entrenamiento completado:

CONTEXTO DEL PROGRAMA:
${formatMeta(meta)}

ENTRENAMIENTO PLANIFICADO:
${formatPlan(planned)}

ENTRENAMIENTO REAL:
${formatWorkout(workout)}
${recentContext}

Evalúa:
1. ¿Cumplió el objetivo del plan? (adherencia)
2. ¿El RPE fue apropiado para la fase actual?
3. Señales de fatiga o sobreentrenamiento
4. Recomendación específica para la próxima sesión
5. Un dato motivador o insight técnico`,
      },
    ],
  });

  return {
    message: response.choices[0]?.message?.content || "Sin respuesta del coach.",
    type: "analysis",
  };
}

/**
 * Pre-workout briefing: what to focus on today, warm-up cues, pacing strategy.
 */
export async function preWorkoutBriefing(
  planned: PlanItem,
  meta: ProgramMeta,
  recentWorkouts: Workout[],
): Promise<CoachResponse> {
  const client = getClient();

  const recentContext = recentWorkouts.length > 0
    ? `\n\nÚLTIMOS ENTRENAMIENTOS:\n${recentWorkouts.map(formatWorkout).join("\n")}`
    : "";

  const response = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.7,
    max_tokens: 400,
    messages: [
      { role: "system", content: COACH_SYSTEM },
      {
        role: "user",
        content: `Dame un briefing PRE-entrenamiento para hoy:

CONTEXTO:
${formatMeta(meta)}

PLAN DE HOY:
${formatPlan(planned)}
${recentContext}

Incluye:
1. Objetivo principal de la sesión (1 frase)
2. Calentamiento recomendado
3. Claves de ejecución (ritmo, sensaciones, qué vigilar)
4. Señales para parar o modificar
5. Mentalidad/enfoque del día`,
      },
    ],
  });

  return {
    message: response.choices[0]?.message?.content || "Sin respuesta del coach.",
    type: "briefing",
  };
}

/**
 * Weekly review: trends, compliance, load management, next week preview.
 */
export async function weeklyReview(
  weekWorkouts: Workout[],
  weekPlans: { date: string; plan: PlanItem }[],
  meta: ProgramMeta,
  prevWeekWorkouts: Workout[],
): Promise<CoachResponse> {
  const client = getClient();

  const weekData = weekWorkouts.map(formatWorkout).join("\n") || "(Sin entrenamientos esta semana)";
  const planData = weekPlans.map((p) => `${p.date}: ${formatPlan(p.plan)}`).join("\n");
  const prevData = prevWeekWorkouts.length > 0
    ? prevWeekWorkouts.map(formatWorkout).join("\n")
    : "(Sin datos de semana anterior)";

  // Calculate basic stats
  const totalMinutes = weekWorkouts.reduce((s, w) => s + (w.minutes ?? 0), 0);
  const prevTotalMinutes = prevWeekWorkouts.reduce((s, w) => s + (w.minutes ?? 0), 0);
  const volumeChange = prevTotalMinutes > 0
    ? Math.round(((totalMinutes - prevTotalMinutes) / prevTotalMinutes) * 100)
    : 0;
  const rpes = weekWorkouts.filter((w) => w.rpe).map((w) => w.rpe!);
  const avgRpe = rpes.length > 0 ? (rpes.reduce((a, b) => a + b, 0) / rpes.length).toFixed(1) : "N/A";
  const runCount = weekWorkouts.filter((w) => w.type === "run").length;
  const gymCount = weekWorkouts.filter((w) => w.type === "gym").length;

  const response = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.7,
    max_tokens: 600,
    messages: [
      { role: "system", content: COACH_SYSTEM },
      {
        role: "user",
        content: `Dame una revisión semanal completa:

CONTEXTO:
${formatMeta(meta)}

ESTADÍSTICAS DE LA SEMANA:
- Minutos totales: ${totalMinutes} (cambio vs semana anterior: ${volumeChange > 0 ? "+" : ""}${volumeChange}%)
- RPE promedio: ${avgRpe}
- Sesiones: ${runCount} runs + ${gymCount} gym
- Entrenamientos completados: ${weekWorkouts.length}/${weekPlans.filter((p) => p.plan.type !== "rest").length} planificados

ENTRENAMIENTOS PLANIFICADOS:
${planData}

ENTRENAMIENTOS REALIZADOS:
${weekData}

SEMANA ANTERIOR:
${prevData}

Evalúa:
1. Resumen ejecutivo (2-3 frases)
2. Cumplimiento del plan (qué se hizo, qué faltó)
3. Carga de entrenamiento: ¿apropiada para la fase? ¿riesgo de sobreentrenamiento?
4. Tendencia: ¿mejorando, manteniendo, o señales de alerta?
5. Recomendaciones para la próxima semana
6. Ajustes sugeridos al plan si los hay`,
      },
    ],
  });

  return {
    message: response.choices[0]?.message?.content || "Sin respuesta del coach.",
    type: "weekly",
  };
}

/**
 * Calculate training zones from user data (HR, pace, RPE mapping).
 */
export async function calculateZones(
  workouts: Workout[],
  meta: ProgramMeta,
  userAge?: number,
  restingHR?: number,
  maxHR?: number,
): Promise<CoachResponse> {
  const client = getClient();

  // Extract HR and pace data from notes (Strava synced workouts have this)
  const runWorkouts = workouts.filter((w) => w.type === "run" && w.notes);
  const hrData = runWorkouts
    .map((w) => {
      const match = w.notes?.match(/FC avg (\d+)/);
      return match ? { date: w.date, hr: parseInt(match[1]), minutes: w.minutes, rpe: w.rpe } : null;
    })
    .filter(Boolean);

  const paceData = runWorkouts
    .map((w) => {
      const match = w.notes?.match(/([\d.]+)\s*km/);
      return match && w.minutes
        ? { date: w.date, km: parseFloat(match[1]), minutes: w.minutes, pace: w.minutes / parseFloat(match[1]) }
        : null;
    })
    .filter(Boolean);

  const response = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.5,
    max_tokens: 600,
    messages: [
      { role: "system", content: COACH_SYSTEM },
      {
        role: "user",
        content: `Calcula mis zonas de entrenamiento y umbrales:

DATOS DEL ATLETA:
- Edad: ${userAge ?? "No proporcionada"}
- FC en reposo: ${restingHR ?? "No proporcionada"}
- FC máxima: ${maxHR ?? "No proporcionada (estimar)"}

DATOS DE FC DE ENTRENAMIENTOS RECIENTES:
${hrData.length > 0 ? hrData.map((d) => `${d!.date}: FC avg ${d!.hr} bpm, ${d!.minutes} min, RPE ${d!.rpe ?? "?"}`).join("\n") : "(Sin datos de FC — estimar basándose en RPE y duración)"}

DATOS DE RITMO:
${paceData.length > 0 ? paceData.map((d) => `${d!.date}: ${d!.km} km en ${d!.minutes} min (${d!.pace!.toFixed(1)} min/km)`).join("\n") : "(Sin datos de ritmo)"}

HISTORIAL RPE (últimos 20 entrenamientos de carrera):
${runWorkouts.slice(0, 20).map(formatWorkout).join("\n") || "(Sin datos)"}

CONTEXTO:
${formatMeta(meta)}

Calcula y presenta:
1. **FC Máxima** (estimada o real)
2. **Zonas de FC** (Z1-Z5 con rangos en bpm)
3. **Umbrales estimados**:
   - Umbral aeróbico (VT1 / LT1)
   - Umbral de lactato (VT2 / LT2)
4. **Zonas de ritmo** (si hay datos de pace): Fácil, Tempo, Umbral, Intervalos
5. **Tabla RPE ↔ Zona ↔ FC** personalizada
6. Recomendaciones para afinar las zonas con datos reales`,
      },
    ],
  });

  return {
    message: response.choices[0]?.message?.content || "Sin respuesta del coach.",
    type: "zones",
  };
}

/**
 * Suggest adjustments to the upcoming plan based on recent performance.
 */
export async function suggestAdjustments(
  recentWorkouts: Workout[],
  upcomingPlans: { date: string; plan: PlanItem }[],
  meta: ProgramMeta,
): Promise<CoachResponse> {
  const client = getClient();

  const recentData = recentWorkouts.map(formatWorkout).join("\n") || "(Sin datos recientes)";
  const upcomingData = upcomingPlans.map((p) => `${p.date}: ${formatPlan(p.plan)}`).join("\n");

  // Detect patterns
  const rpes = recentWorkouts.filter((w) => w.rpe).map((w) => w.rpe!);
  const avgRpe = rpes.length > 0 ? (rpes.reduce((a, b) => a + b, 0) / rpes.length).toFixed(1) : "N/A";
  const highRpeCount = rpes.filter((r) => r >= 8).length;
  const totalMinutes = recentWorkouts.reduce((s, w) => s + (w.minutes ?? 0), 0);

  const response = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.7,
    max_tokens: 500,
    messages: [
      { role: "system", content: COACH_SYSTEM },
      {
        role: "user",
        content: `Basándote en mi rendimiento reciente, sugiere ajustes para los próximos entrenamientos:

CONTEXTO:
${formatMeta(meta)}

SEÑALES DETECTADAS:
- RPE promedio últimas sesiones: ${avgRpe}
- Sesiones con RPE ≥ 8 (alta intensidad): ${highRpeCount}/${rpes.length}
- Volumen total reciente: ${totalMinutes} min

ÚLTIMOS ENTRENAMIENTOS (14 días):
${recentData}

PLAN PRÓXIMA SEMANA:
${upcomingData}

Analiza y sugiere:
1. ¿El plan actual es apropiado dado el rendimiento reciente?
2. Ajustes específicos por sesión (con valores concretos de minutos/RPE)
3. ¿Hay que reducir volumen, intensidad, o ambos?
4. ¿Hay que aumentar algo?
5. Señales de alerta si las hay
6. Plan B si el atleta no se siente bien el día de la sesión`,
      },
    ],
  });

  return {
    message: response.choices[0]?.message?.content || "Sin respuesta del coach.",
    type: "adjustment",
  };
}
