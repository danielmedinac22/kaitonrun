"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon?: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-indigo-50 text-indigo-700"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

export function MobileNavLink({
  href,
  label,
  icon,
  variant = "default",
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  variant?: "default" | "primary";
}) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

  if (variant === "primary") {
    return (
      <Link
        href={href}
        className="flex flex-col items-center justify-center gap-0.5"
      >
        <span
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-2xl shadow-lg transition-all",
            isActive
              ? "bg-indigo-700 text-white shadow-indigo-200 scale-105"
              : "bg-indigo-600 text-white shadow-indigo-100 active:scale-95"
          )}
        >
          {icon}
        </span>
        <span className={cn(
          "text-[10px] font-semibold",
          isActive ? "text-indigo-700" : "text-indigo-600"
        )}>
          {label}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "relative flex flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium transition-colors",
        isActive ? "text-indigo-600" : "text-slate-400"
      )}
    >
      {isActive && (
        <span className="absolute -top-1.5 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-indigo-600" />
      )}
      <span className={cn(
        "flex h-6 w-6 items-center justify-center transition-colors",
        isActive ? "text-indigo-600" : "text-slate-400"
      )}>
        {icon}
      </span>
      {label}
    </Link>
  );
}
