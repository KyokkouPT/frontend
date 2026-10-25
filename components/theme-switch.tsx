"use client";

import { useEffect, useId, useState } from "react";
import { flushSync } from "react-dom";
import { cn } from "@/lib/cn";

type Theme = "aurora" | "polar";

/** 太阳的 8 条光线，半径 9.5 → 11.2 */
const RAYS = Array.from({ length: 8 }, (_, i) => {
  const a = (i * 45 * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return {
    x1: 12 + 9.5 * c,
    y1: 12 + 9.5 * s,
    x2: 12 + 11.2 * c,
    y2: 12 + 11.2 * s,
  };
});

/**
 * 主题切换：单个按钮。图标表示**当前主题**（浅色=太阳，深色=月牙），
 * 无障碍标签描述的是**点击后的动作**（"切换到深色主题"）。
 *
 * 图标是真正的日月形变，不是两张图交叉淡入：
 * - 8 条光线旋转 + 缩小收回；
 * - 圆盘用 SVG mask 里的偏移圆「咬」掉一块，变成月牙；
 * - 两者同时进行，中间状态是一个正在被啃掉的太阳。
 * 缓动用 cubic-bezier(.34,1.2,.64,1)，末尾有轻微回弹。
 */
export function ThemeSwitch({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("polar");
  const maskId = useId().replace(/:/g, "");

  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    if (current === "aurora" || current === "polar") setTheme(current);
  }, []);

  const isDark = theme === "aurora";

  function toggle() {
    const next: Theme = isDark ? "polar" : "aurora";
    const root = document.documentElement;

    // 同一帧内切主题与图标状态，避免出现「半旧半新」的一帧。
    // 注意：不能给 <html> 加全局 transition:none —— 那会把图标自己的形变也杀掉。
    flushSync(() => {
      root.dataset.theme = next;
      setTheme(next);
    });

    try {
      localStorage.setItem("kp-theme", next);
    } catch {
      /* 隐私模式下忽略 */
    }
  }

  const toDark = !isDark;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={toDark ? "切换到深色主题" : "切换到亮色主题"}
      title={toDark ? "切换到深色主题" : "切换到亮色主题"}
      className={cn(
        "group grid size-10 shrink-0 place-items-center rounded-sm text-fg-1",
        "transition-[background-color,color,transform] duration-200",
        "hover:bg-surface-2 hover:text-fg-0 active:scale-95 md:size-[34px]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="size-[18px] overflow-visible"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
            <rect x="0" y="0" width="24" height="24" fill="white" />
            {/* 偏移的黑色圆：滑进圆盘里就把它啃成月牙 */}
            <circle
              cx="12"
              cy="12"
              r="7"
              fill="black"
              style={{ transformOrigin: "12px 12px" }}
              className={cn(
                "transition-transform duration-[460ms] ease-[cubic-bezier(.34,1.2,.64,1)] motion-reduce:transition-none",
                isDark ? "translate-x-[5px] -translate-y-[3px]" : "translate-x-[17px] -translate-y-[17px]",
              )}
            />
          </mask>
        </defs>

        {/* 光线：深色时旋转并缩小收回 */}
        <g
          style={{ transformOrigin: "12px 12px" }}
          className={cn(
            "transition-[transform,opacity] duration-[420ms] ease-[cubic-bezier(.34,1.2,.64,1)] motion-reduce:transition-none",
            isDark
              ? "opacity-0 [transform:rotate(-70deg)_scale(.25)]"
              : "opacity-100 [transform:rotate(0deg)_scale(1)]",
          )}
        >
          {RAYS.map((r, i) => (
            <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} />
          ))}
        </g>

        {/* 圆盘：始终存在，靠 mask 在「整圆」与「月牙」之间过渡 */}
        <circle
          cx="12"
          cy="12"
          r="7"
          mask={`url(#${maskId})`}
          className={cn(
            "transition-transform duration-[460ms] ease-[cubic-bezier(.34,1.2,.64,1)] motion-reduce:transition-none",
            isDark ? "[transform:rotate(-12deg)_scale(.96)]" : "[transform:rotate(0deg)_scale(1)]",
          )}
          style={{ transformOrigin: "12px 12px" }}
        />
      </svg>
    </button>
  );
}
