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
        "inline-flex items-center gap-1.5 rounded-card px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary-soft text-primary"
          : "text-txt-secondary hover:bg-surface-elevated hover:text-txt-primary",
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
  variant?: "default" | "primary" | "accent";
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
            "flex h-11 w-11 items-center justify-center rounded-2xl shadow-card transition-all",
            isActive
              ? "bg-primary-hover text-primary-text scale-105"
              : "bg-primary text-primary-text active:scale-95",
          )}
        >
          {icon}
        </span>
        <span
          className={cn(
            "text-[10px] font-semibold",
            isActive ? "text-primary-hover" : "text-primary",
          )}
        >
          {label}
        </span>
      </Link>
    );
  }

  if (variant === "accent") {
    return (
      <Link
        href={href}
        className="flex flex-col items-center justify-center gap-0.5"
      >
        <span
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-2xl shadow-card transition-all",
            isActive
              ? "bg-secondary-hover text-surface scale-105"
              : "bg-secondary text-surface active:scale-95",
          )}
        >
          {icon}
        </span>
        <span
          className={cn(
            "text-[10px] font-semibold",
            isActive ? "text-secondary-hover" : "text-secondary",
          )}
        >
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
        isActive ? "text-primary" : "text-txt-muted",
      )}
    >
      {isActive && (
        <span className="absolute -top-1.5 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-primary" />
      )}
      <span
        className={cn(
          "flex h-6 w-6 items-center justify-center transition-colors",
          isActive ? "text-primary" : "text-txt-muted",
        )}
      >
        {icon}
      </span>
      {label}
    </Link>
  );
}
