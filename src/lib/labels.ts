import { Activity, Dumbbell, Moon } from "lucide-react";
import { createElement } from "react";

export function typeLabel(type: string) {
  if (type === "run") return "Correr";
  if (type === "gym") return "Fortalecimiento";
  return "Descanso";
}

export function typeIcon(type: string, className = "h-4 w-4") {
  if (type === "run") return createElement(Activity, { className });
  if (type === "gym") return createElement(Dumbbell, { className });
  return createElement(Moon, { className });
}

export function typeBorderColor(type: string) {
  if (type === "run") return "border-l-indigo-400";
  if (type === "gym") return "border-l-emerald-400";
  return "border-l-slate-300";
}

export function typeIconColor(type: string) {
  if (type === "run") return "text-indigo-500";
  if (type === "gym") return "text-emerald-500";
  return "text-slate-400";
}

export function typeBgColor(type: string) {
  if (type === "run") return "bg-indigo-100 text-indigo-600";
  if (type === "gym") return "bg-emerald-100 text-emerald-600";
  return "bg-slate-100 text-slate-500";
}
