"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@kyokkou/contracts";
import { isNavItemActive } from "@/lib/nav";
import { navIcon } from "@/lib/nav-icons";
import { cn } from "@/lib/cn";
import { useBootstrap } from "./providers/bootstrap-provider";

function NavRow({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isNavItemActive(item, pathname);
  const Icon = navIcon(item.icon);

  return (
    <Link
      href={item.href}
      title={item.label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-8 items-center gap-2.5 rounded-sm px-3 text-sm font-medium text-fg-1 transition-colors",
        "hover:bg-surface-2 hover:text-fg-0",
        "max-xl:justify-center max-xl:px-0",
        active && "bg-accent/12 font-semibold text-accent",
      )}
    >
      <Icon className="size-4 shrink-0 opacity-85" />
      <span className="hidden xl:inline">{item.label}</span>
      {item.badge && (
        <span className="ml-auto hidden rounded-[4px] bg-surface-2 px-1.5 py-0.5 font-mono text-2xs text-fg-2 xl:inline">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

/** 站点侧栏；< md 隐藏，移动端由 MobileNav 抽屉承担。 */
export function Sidebar() {
  const bootstrap = useBootstrap();
  const pathname = usePathname() ?? "/";
  const groups = bootstrap?.nav.site ?? [];

  return (
    <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] flex-col gap-6 overflow-y-auto overscroll-contain border-r border-line px-3 py-4 md:flex max-xl:px-2">
      {groups.map((group, groupIndex) => (
        <nav
          key={group.label ?? `group-${String(groupIndex)}`}
          className="grid gap-px"
          aria-label={group.label ?? "站点"}
        >
          {group.label && (
            <p className="px-3 pb-2 text-2xs font-semibold tracking-[0.08em] text-fg-2 uppercase max-xl:hidden">
              {group.label}
            </p>
          )}
          {group.items.map((item) => (
            <NavRow key={item.key} item={item} pathname={pathname} />
          ))}
        </nav>
      ))}

      <div className="mt-auto hidden rounded-md border border-line bg-surface-1 px-3 py-3 xl:block">
        <p className="text-2xs font-semibold tracking-[0.08em] text-fg-2 uppercase">版本</p>
        <p className="mt-1 font-mono text-xs text-fg-1">{bootstrap?.site.version ?? "—"}</p>
        {bootstrap?.counts && bootstrap.counts.pending_review > 0 && (
          <p className="mt-2 text-2xs text-warn">待审种子 {bootstrap.counts.pending_review}</p>
        )}
      </div>
    </aside>
  );
}
