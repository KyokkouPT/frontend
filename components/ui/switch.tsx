"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

/** 开关。仅用于前端演示，状态不落库。 */
export function Switch({
  defaultChecked = false,
  label,
  hint,
  name,
  disabled,
  onCheckedChange,
}: {
  defaultChecked?: boolean;
  label?: string;
  hint?: string;
  name?: string;
  disabled?: boolean;
  onCheckedChange?: (next: boolean) => void;
}) {
  const [on, setOn] = useState(defaultChecked);

  return (
    <label
      className={cn(
        "flex items-start gap-3 py-1.5",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
      )}
    >
      <button
        type="button"
        role="switch"
        name={name}
        aria-checked={on}
        aria-label={label}
        disabled={disabled}
        onClick={() => {
          setOn((v) => {
            onCheckedChange?.(!v);
            return !v;
          });
        }}
        className={cn(
          "relative mt-0.5 h-[20px] w-[34px] shrink-0 rounded-pill border transition-colors",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          on ? "border-accent bg-accent" : "border-line-strong bg-surface-3",
        )}
      >
        <span
          className={cn(
            "absolute top-[2px] left-[2px] size-[14px] rounded-pill transition-transform",
            on ? "translate-x-[14px] bg-accent-ink" : "bg-fg-1",
          )}
        />
      </button>
      {(label || hint) && (
        <span className="grid gap-0.5">
          {label && <span className="text-sm text-fg-0">{label}</span>}
          {hint && <span className="text-[11.5px] leading-4 text-fg-2">{hint}</span>}
        </span>
      )}
    </label>
  );
}
