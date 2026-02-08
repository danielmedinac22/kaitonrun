export default function PaceTrend({ paces }: { paces: { date: string; pace: number }[] }) {
  if (paces.length < 2) return null;

  const minPace = Math.floor(Math.min(...paces.map((p) => p.pace)) * 10) / 10;
  const maxPace = Math.ceil(Math.max(...paces.map((p) => p.pace)) * 10) / 10;
  const range = maxPace - minPace || 1;

  const w = 280;
  const h = 80;
  const padX = 10;
  const padY = 10;

  const points = paces.map((p, i) => {
    const x = padX + (i / (paces.length - 1)) * (w - 2 * padX);
    const y = padY + ((p.pace - minPace) / range) * (h - 2 * padY);
    // Inverted: lower pace = higher on chart (faster)
    return { x, y: h - y + padY, label: `${Math.floor(p.pace)}:${String(Math.round((p.pace % 1) * 60)).padStart(2, "0")}`, date: p.date };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="text-xs font-semibold text-txt-secondary mb-2">Tendencia de ritmo</div>
      <svg viewBox={`0 0 ${w} ${h + 20}`} className="w-full" style={{ maxHeight: "120px" }}>
        <path d={pathD} fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--color-primary)" />
        ))}
        {/* Labels for first and last */}
        {points.length > 0 && (
          <>
            <text x={points[0].x} y={h + 14} textAnchor="start" className="fill-[var(--color-text-muted)] text-[8px]">
              {paces[0].date.slice(5)}
            </text>
            <text x={points[points.length - 1].x} y={h + 14} textAnchor="end" className="fill-[var(--color-text-muted)] text-[8px]">
              {paces[paces.length - 1].date.slice(5)}
            </text>
            <text x={points[0].x} y={points[0].y - 6} textAnchor="start" className="fill-[var(--color-primary)] text-[9px] font-semibold">
              {points[0].label}
            </text>
            <text x={points[points.length - 1].x} y={points[points.length - 1].y - 6} textAnchor="end" className="fill-[var(--color-primary)] text-[9px] font-semibold">
              {points[points.length - 1].label}
            </text>
          </>
        )}
      </svg>
      <div className="mt-1 text-[10px] text-txt-muted text-center">min/km (ms arriba = ms rpido)</div>
    </div>
  );
}
