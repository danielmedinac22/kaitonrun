type Variant = "planned" | "done" | "pending" | "moved";

const styles: Record<Variant, string> = {
  planned: "bg-indigo-50 text-indigo-700 border-indigo-200",
  done: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  moved: "bg-slate-50 text-slate-700 border-slate-200",
};

export function Badge({ variant, children }: { variant: Variant; children: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
}
