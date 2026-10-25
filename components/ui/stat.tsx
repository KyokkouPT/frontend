import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

const TONE = {
  default: "text-fg-0",
  accent: "text-accent",
  ok: "text-ok",
  warn: "text-warn",
  danger: "text-danger",
} as const;

export function StatCard({
  label,
  value,
  sub,
  tone = "default",
  icon,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: keyof typeof TONE;
  icon?: ReactNode;
}) {
  return (
    <div className="grid content-start gap-1 rounded-md border border-line bg-surface-1 p-4">
      <div className="flex items-center gap-1.5 text-2xs tracking-[0.06em] text-fg-2 uppercase">
        {icon}
        {label}
      </div>
      <div className={cn("font-mono text-xl leading-none font-semibold tracking-tight", TONE[tone])}>
        {value}
      </div>
      {sub && <div className="text-xs text-fg-2">{sub}</div>}
    </div>
  );
}

/** 键值行：左标签右数值，数值等宽右对齐 */
export function StatRow({
  k,
  v,
  tone,
  mono = true,
}: {
  k: ReactNode;
  v: ReactNode;
  tone?: keyof typeof TONE;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-[12.5px]">
      <span className="min-w-0 truncate text-fg-2">{k}</span>
      <span
        className={cn(
          "ml-auto shrink-0 text-[12.5px] font-medium",
          mono && "font-mono",
          tone ? TONE[tone] : "",
        )}
      >
        {v}
      </span>
    </div>
  );
}

export function Bar({
  value,
  tone = "accent",
  height = 6,
  label,
}: {
  /** 0-100 */
  value: number;
  tone?: "accent" | "ok" | "warn" | "danger";
  height?: number;
  label?: ReactNode;
}) {
  // 实心语义色必须走 background-color；只有 accent 是渐变（background-image）
  const fill: CSSProperties =
    tone === "accent"
      ? {
          backgroundImage:
            "linear-gradient(90deg, var(--color-accent), color-mix(in oklab, var(--color-accent) 50%, var(--color-accent-2)))",
        }
      : { backgroundColor: `var(--color-${tone})` };

  return (
    <div className="grid gap-1.5">
      {label && <div className="flex justify-between text-[11.5px] text-fg-2">{label}</div>}
      <div
        className="overflow-hidden rounded-sm bg-surface-3"
        style={{ height }}
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <i
          className="block h-full rounded-sm transition-[width] duration-500"
          style={{ width: `${Math.max(0, Math.min(100, value))}%`, ...fill }}
        />
      </div>
    </div>
  );
}
