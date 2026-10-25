import type { ReactNode } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/cn";

const TONE = {
  warn: {
    Icon: AlertTriangle,
    box: "border-warn/35 bg-warn/10 text-warn",
  },
  info: {
    Icon: Info,
    box: "border-accent/30 bg-accent/10 text-accent",
  },
} as const;

export function Notice({
  tone = "warn",
  children,
  className,
}: {
  tone?: keyof typeof TONE;
  children: ReactNode;
  className?: string;
}) {
  const { Icon, box } = TONE[tone];

  return (
    <div
      className={cn(
        "grid grid-cols-[16px_minmax(0,1fr)] gap-2 rounded-sm border border-l-[3px] p-3 text-[12.5px] leading-normal",
        box,
        className,
      )}
    >
      <Icon className="mt-0.5 size-[15px]" />
      <div>{children}</div>
    </div>
  );
}
