"use client";

import { useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  addDays,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { typeIcon, typeBgColor } from "@/lib/labels";
import { cn } from "@/lib/utils";

type CalendarDay = {
  date: string;
  type: "run" | "gym" | "rest";
  done: boolean;
  title: string;
  targetMinutes?: number;
  rpe?: string;
  details: string[];
};

const TYPE_DOT: Record<string, string> = {
  run: "bg-primary",
  gym: "bg-success",
  rest: "bg-border",
};

const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function MonthCalendarView({
  days,
}: {
  days: CalendarDay[];
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const dayMap = new Map(days.map((d) => [d.date, d]));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });

  // Build weeks array
  const weeks: Date[][] = [];
  let day = calStart;
  while (day <= monthEnd || weeks.length < 5) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
    if (weeks.length >= 6) break;
  }

  const today = new Date();
  const selected = selectedDate ? dayMap.get(selectedDate) : null;

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => { setCurrentMonth(subMonths(currentMonth, 1)); setSelectedDate(null); }}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-txt-muted transition-colors hover:bg-surface-elevated hover:text-txt-secondary"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-txt-primary capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: es })}
        </span>
        <button
          onClick={() => { setCurrentMonth(addMonths(currentMonth, 1)); setSelectedDate(null); }}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-txt-muted transition-colors hover:bg-surface-elevated hover:text-txt-secondary"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_NAMES.map((name) => (
          <div key={name} className="text-center text-[10px] font-medium text-txt-muted">
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map((d, idx) => {
          const key = format(d, "yyyy-MM-dd");
          const inMonth = isSameMonth(d, currentMonth);
          const isToday = isSameDay(d, today);
          const entry = dayMap.get(key);
          const isSelected = selectedDate === key;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedDate(isSelected ? null : key)}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg py-1.5 text-xs transition-colors",
                !inMonth && "opacity-30",
                isToday && !isSelected && "bg-primary-soft ring-1 ring-primary/30",
                isSelected && "bg-primary text-primary-text ring-1 ring-primary shadow-sm",
              )}
            >
              <span
                className={cn(
                  "font-medium",
                  isSelected
                    ? "text-primary-text font-bold"
                    : isToday
                      ? "text-primary font-bold"
                      : inMonth
                        ? "text-txt-primary"
                        : "text-txt-muted",
                )}
              >
                {format(d, "d")}
              </span>
              {entry && entry.type !== "rest" && (
                <div className="mt-0.5 flex items-center gap-0.5">
                  <span className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    isSelected ? "bg-primary-text" : TYPE_DOT[entry.type],
                  )} />
                  {entry.done && !isSelected && (
                    <span className="text-[7px] font-bold text-success">&#10003;</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day detail panel */}
      {selected && (
        <div className="mt-3 animate-fade-in rounded-lg border border-border bg-surface-elevated p-3">
          <div className="flex items-start gap-3">
            <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", typeBgColor(selected.type))}>
              {typeIcon(selected.type, "h-4 w-4")}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-txt-primary">
                  {format(parseISO(selected.date), "EEEE d MMM", { locale: es })}
                </span>
                {selected.done && (
                  <Badge variant="done" className="text-[10px]">Hecho</Badge>
                )}
              </div>
              <div className="mt-0.5 text-xs font-medium text-txt-secondary">{selected.title}</div>

              {selected.type !== "rest" && (
                <>
                  {selected.details.length > 0 && (
                    <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-txt-secondary">
                      {selected.details.slice(0, 3).map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-1.5 text-[11px] text-txt-muted">
                    {selected.targetMinutes ? `${selected.targetMinutes} min` : ""}
                    {selected.rpe ? ` · RPE ${selected.rpe}` : ""}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-txt-secondary">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-primary" />
          Correr
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-success" />
          Gym
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[8px] font-bold text-success">&#10003;</span>
          Hecho
        </div>
      </div>
    </div>
  );
}
