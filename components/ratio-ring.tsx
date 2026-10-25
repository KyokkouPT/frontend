/** 分享率环。ratio 为弧长占比，仅作视觉表达。 */
export function RatioRing({ value, ratio = 0.62 }: { value: string; ratio?: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, ratio));

  return (
    <div className="relative size-24 shrink-0">
      <svg viewBox="0 0 96 96" className="size-full -rotate-90" aria-hidden>
        <defs>
          <linearGradient id="ratio-ring-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" />
            <stop offset="100%" stopColor="var(--color-accent-2)" />
          </linearGradient>
        </defs>
        <circle cx="48" cy="48" r={radius} fill="none" stroke="var(--color-ring-track)" strokeWidth={6} />
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="url(#ratio-ring-gradient)"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
          className="transition-[stroke-dashoffset] duration-700 motion-reduce:transition-none"
        />
      </svg>
      <div className="absolute inset-0 grid place-content-center gap-0.5 text-center">
        <b className="font-mono text-xl leading-none font-semibold tracking-[-0.02em]">{value}</b>
        <span className="text-[10px] tracking-[0.06em] text-fg-2 uppercase">分享率</span>
      </div>
    </div>
  );
}
