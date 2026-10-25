import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "default" | "accent" | "ok" | "warn" | "danger" | "free" | "muted" | "outline";

const TONE: Record<BadgeTone, string> = {
  default: "border-line bg-surface-2 text-fg-1",
  accent: "border-transparent bg-accent/12 text-accent",
  ok: "border-transparent bg-ok/12 text-ok",
  warn: "border-transparent bg-warn/12 text-warn",
  danger: "border-transparent bg-danger/12 text-danger",
  free: "border-transparent bg-free/12 text-free",
  muted: "border-transparent bg-surface-2 text-fg-2",
  outline: "border-line-strong text-fg-1",
};

export function Badge({
  children,
  tone = "default",
  mono,
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  mono?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-pill border px-1.5 py-px text-2xs leading-4 whitespace-nowrap",
        mono && "font-mono",
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
