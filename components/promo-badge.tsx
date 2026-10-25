import type { Promo } from "@kyokkou/contracts";
import { cn } from "@/lib/cn";

const TEXT: Record<Promo, string> = {
  free: "FREE",
  "2x": "2x",
  "50": "-50%",
  "30": "-70%",
  none: "—",
};

/**
 * 促销角标：固定宽度独立成列，颜色 + 文字双编码，不靠颜色单独传达语义。
 */
const STYLE: Record<Promo, string> = {
  free: "border-free/40 bg-free/15 text-free",
  "2x": "border-promo2x/40 bg-accent/15 text-promo2x",
  "50": "border-warn/40 bg-warn/15 text-warn",
  "30": "border-warn/45 text-warn",
  none: "border-transparent text-fg-2 opacity-50",
};

export function PromoBadge({ promo, className }: { promo: Promo; className?: string }) {
  return (
    <span
      title="促销"
      className={cn(
        "inline-flex h-[22px] w-11 shrink-0 items-center justify-center rounded-sm border",
        "font-mono text-[10px] font-semibold uppercase tracking-[0.06em]",
        STYLE[promo],
        className,
      )}
    >
      {TEXT[promo]}
    </span>
  );
}
