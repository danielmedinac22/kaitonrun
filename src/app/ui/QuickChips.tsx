import Link from "next/link";

type QuickChipsProps = {
  chips: Array<{
    href: string;
    icon: React.ReactNode;
    label: string;
  }>;
};

export default function QuickChips({ chips }: QuickChipsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {chips.map((chip) => (
        <Link
          key={chip.href}
          href={chip.href}
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-card-lg border border-border bg-surface px-3 text-sm font-medium text-txt-secondary shadow-card transition-all hover:border-primary hover:text-primary hover:shadow-card-hover active:scale-[0.97]"
        >
          {chip.icon}
          {chip.label}
        </Link>
      ))}
    </div>
  );
}
