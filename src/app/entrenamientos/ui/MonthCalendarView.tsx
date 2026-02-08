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
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type CalendarDay = {
  date: string;
  type: "run" | "gym" | "rest";
  done: boolean;
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

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-txt-muted transition-colors hover:bg-surface-elevated hover:text-txt-secondary"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-txt-primary capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: es })}
        </span>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
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

          return (
            <div
              key={idx}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg py-1.5 text-xs transition-colors",
                !inMonth && "opacity-30",
                isToday && "bg-primary-soft ring-1 ring-primary/30",
              )}
            >
              <span
                className={cn(
                  "font-medium",
                  isToday ? "text-primary font-bold" : inMonth ? "text-txt-primary" : "text-txt-muted",
                )}
              >
                {format(d, "d")}
              </span>
              {entry && entry.type !== "rest" && (
                <div className="mt-0.5 flex items-center gap-0.5">
                  <span className={cn("h-1.5 w-1.5 rounded-full", TYPE_DOT[entry.type])} />
                  {entry.done && (
                    <span className="text-[7px] font-bold text-success">&#10003;</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

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
