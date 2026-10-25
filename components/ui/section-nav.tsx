"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export type SectionNavItem = { href: string; label: string; badge?: string };

/** 二级导航（「我的」「站务」共用）。按路径高亮当前项。 */
export function SectionNav({
  items,
  label,
  className,
}: {
  items: SectionNavItem[];
  label: string;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={label}
      className={cn(
        "flex gap-1 overflow-x-auto border-b border-line pb-px [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative shrink-0 px-3 py-2 text-sm whitespace-nowrap transition-colors",
              "hover:text-fg-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent",
              active
                ? "font-semibold text-fg-0 after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-sm after:bg-accent"
                : "font-medium text-fg-1",
            )}
          >
            {item.label}
            {item.badge && (
              <span className="ml-1.5 rounded-[4px] bg-surface-2 px-1 py-0.5 font-mono text-2xs text-fg-2">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
