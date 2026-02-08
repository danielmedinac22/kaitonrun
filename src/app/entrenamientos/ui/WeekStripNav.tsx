"use client";

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
    <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
      {days.map((d) => (
        <div
          key={d.date}
          className={cn(
            "flex flex-col items-center rounded-xl py-2.5 text-center transition-colors",
            d.isToday
              ? "bg-primary text-primary-text shadow-sm"
              : d.done
                ? "bg-success-soft text-txt-primary"
                : "bg-surface-elevated text-txt-secondary",
          )}
        >
          <span className="text-[10px] font-semibold uppercase">{d.dow}</span>
          <span className="text-sm font-bold">{d.dayNum}</span>
          <div className="flex h-3 items-center justify-center">
            {d.done && !d.isToday ? (
              <span className="text-[8px] font-semibold text-success">&#10003;</span>
            ) : (
              <span className={cn(
                "h-1.5 w-1.5 rounded-full",
                d.isToday ? "bg-white" : TYPE_DOTS[d.type] ?? "bg-border",
              )} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
