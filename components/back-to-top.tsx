"use client";

import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * 回到顶部：原生 scrollTo 平滑滚动；禁用 JS 时仍是 #top 锚点。
 */
export function BackToTop({ className }: { className?: string }) {
  function onClick(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, left: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  return (
    <a
      href="#top"
      onClick={onClick}
      className={cn(
        "group inline-flex items-center gap-1 transition-colors hover:text-accent",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        className,
      )}
    >
      <ArrowUp className="size-3 transition-transform duration-200 group-hover:-translate-y-0.5 group-active:-translate-y-1" />
      回到顶部
    </a>
  );
}
