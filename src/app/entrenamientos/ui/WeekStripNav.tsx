"use client";

import { format } from "date-fns";
import { cn } from "@/lib/utils";

type DayInfo = {
  date: string;
  dow: string;
  dayNum: string;
  type: string;
  done: boolean;
  isToday: boolean;
};

const TYPE_DOTS: Record<string, string> = {
  run: "bg-primary",
  gym: "bg-success",
  rest: "bg-border",
};

export default function WeekStripNav({ days }: { days: DayInfo[] }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      {days.map((d) => (
        <div
          key={d.date}
          className={cn(
            "flex min-w-[3rem] flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-center transition-colors",
            d.isToday
              ? "bg-primary text-primary-text shadow-sm"
              : d.done
                ? "bg-success-soft text-txt-primary"
                : "bg-surface-elevated text-txt-secondary",
          )}
        >
          <span className="text-[10px] font-semibold uppercase">{d.dow}</span>
          <span className="text-sm font-bold">{d.dayNum}</span>
          <span className={cn(
            "h-1.5 w-1.5 rounded-full",
            d.isToday ? "bg-white" : TYPE_DOTS[d.type] ?? "bg-border",
          )} />
          {d.done && !d.isToday && (
            <span className="text-[8px] font-semibold text-success">&#10003;</span>
          )}
        </div>
      ))}
    </div>
  );
}
