"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { isNavItemActive } from "@/lib/nav";
import { navIcon } from "@/lib/nav-icons";
import { setNavOpen } from "@/lib/nav-store";
import { cn } from "@/lib/cn";
import { useBootstrap } from "./providers/bootstrap-provider";

/**
 * 移动端底部标签栏：bootstrap.nav.site 前 4 项 + 「更多」。
 * 每格 56px，满足 44px 最小触控尺寸。
 */
export function MobileTabBar() {
  const bootstrap = useBootstrap();
  const pathname = usePathname() ?? "/";
  const tabs = (bootstrap?.nav.site.flatMap((group) => group.items) ?? []).slice(0, 4);
  const columns = tabs.length + 1;

  return (
    <nav
      aria-label="快捷入口"
      className="fixed inset-x-0 bottom-0 z-[150] border-t border-line bg-surface-0/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {tabs.map((tab) => {
          const active = isNavItemActive(tab, pathname);
          const Icon = navIcon(tab.icon);
          return (
            <li key={tab.key}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-14 flex-col items-center justify-center gap-1 transition-colors",
                  active ? "text-accent" : "text-fg-2 hover:text-fg-0",
                )}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-x-0 top-0 mx-auto h-0.5 w-8 rounded-b bg-accent"
                  />
                )}
                <Icon className="size-5" />
                <span className={cn("text-[10px] leading-none", active && "font-semibold")}>
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}

        <li>
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="更多"
            className="flex h-14 w-full flex-col items-center justify-center gap-1 text-fg-2 transition-colors hover:text-fg-0"
          >
            <Menu className="size-5" />
            <span className="text-[10px] leading-none">更多</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
