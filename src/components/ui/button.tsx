import Link from "next/link";
import { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost";

type Props = ComponentProps<"button"> & {
  variant?: Variant;
  asLinkHref?: string;
};

const styles: Record<Variant, string> = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/10",
  secondary:
    "bg-white text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-sm",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
};

export function Button({ variant = "primary", asLinkHref, className = "", ...props }: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white";

  if (asLinkHref) {
    return (
      <Link
        href={asLinkHref}
        className={`${base} ${styles[variant]} ${className}`}
      />
    );
  }

  return (
    <button
      {...props}
      className={`${base} ${styles[variant]} disabled:opacity-50 disabled:pointer-events-none ${className}`}
    />
  );
}
