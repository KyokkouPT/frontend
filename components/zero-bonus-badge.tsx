import { cn } from "@/lib/cn";

export function ZeroBonusBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-pill border border-warn/40 bg-warn/12 px-1.5 py-px text-2xs font-medium text-warn",
        className,
      )}
      title="零魔种子：做种魔力权重 0.2"
    >
      零魔
    </span>
  );
}
