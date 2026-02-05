import { ReactNode } from "react";

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div>
        <div className="text-base font-semibold text-slate-900">{title}</div>
        {subtitle ? <div className="mt-1 text-sm text-slate-500">{subtitle}</div> : null}
      </div>
      {right ? <div className="pt-0.5">{right}</div> : null}
    </div>
  );
}

export function CardBody({ children }: { children: ReactNode }) {
  return <div className="px-5 py-4">{children}</div>;
}
