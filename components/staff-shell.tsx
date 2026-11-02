"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Menu, ShieldCheck, X } from "lucide-react";
import type { NavGroup } from "@kyokkou/contracts";
import { isNavItemActive } from "@/lib/nav";
import { navIcon } from "@/lib/nav-icons";
import { cn } from "@/lib/cn";
import { BrandMark } from "./brand-mark";
import { ThemeSwitch } from "./theme-switch";
import { UserMenu } from "./user-menu";
import { SiteFooter } from "./site-footer";
import { Badge } from "./ui/badge";
import { useBootstrap } from "./providers/bootstrap-provider";

function StaffNavGroups({
  groups,
  pathname,
  onNavigate,
  compact = false,
}: {
  groups: NavGroup[];
  pathname: string;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const allItems = groups.flatMap((group) => group.items);
  return (
    <nav className={cn("grid", compact ? "gap-4" : "gap-5")} aria-label="站务导航">
      {groups.map((group, groupIndex) => {
        const activeGroup = group.items.some((item) => isNavItemActive(item, pathname, allItems));
        return (
          <section
            key={group.label ?? `staff-group-${String(groupIndex)}`}
            aria-label={group.label ?? "站务"}
            className="grid gap-1"
          >
            {group.label && (
              <p
                className={cn(
                  "px-2 pb-1 text-2xs font-semibold tracking-[0.08em] uppercase",
                  activeGroup ? "text-accent" : "text-fg-2",
                )}
              >
                {group.label}
              </p>
            )}
            <div className="grid gap-px border-l border-line/70 pl-2">
              {group.items.map((item) => {
                const active = isNavItemActive(item, pathname, allItems);
                const Icon = navIcon(item.icon);
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={onNavigate}
                    className={cn(
                      "flex h-9 items-center gap-2.5 rounded-sm px-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-accent/12 text-accent"
                        : "text-fg-1 hover:bg-surface-2 hover:text-fg-0",
                    )}
                  >
                    <Icon className="size-4 shrink-0 opacity-85" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </nav>
  );
}

/** 站务后台骨架：独立顶栏语境 + 自己的导航，与站点壳共用同一套 token。 */
export function StaffShell({ children }: { children: ReactNode }) {
  const bootstrap = useBootstrap();
  const pathname = usePathname() ?? "/";
  const groups = bootstrap?.nav.staff ?? [];
  const [open, setOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // 只重置右侧内容滚动；左侧导航保持原滚动位置。
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="sticky top-0 z-[100] flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface-0/86 px-3 backdrop-blur-md backdrop-saturate-150 md:px-4">
        <button
          type="button"
          aria-label="打开站务导航"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="grid size-9 place-items-center rounded-sm text-fg-1 transition-colors hover:bg-surface-2 hover:text-fg-0 md:hidden"
        >
          <Menu className="size-5" />
        </button>

        <Link href="/staff/review" className="flex items-center gap-2" aria-label="站务后台">
          <BrandMark size={22} />
          <Badge tone="accent" className="max-sm:hidden">
            <ShieldCheck className="size-3" />
            站务后台
          </Badge>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/"
            className="hidden h-[34px] items-center rounded-sm border border-line bg-surface-1 px-2.5 text-xs text-fg-1 transition-colors hover:border-line-strong hover:bg-surface-2 hover:text-fg-0 sm:inline-flex"
          >
            ← 返回站点
          </Link>
          <ThemeSwitch />
          <UserMenu />
        </div>
      </header>

      {open && (
        <>
          <button
            type="button"
            aria-label="关闭站务导航"
            className="fixed inset-0 z-[105] bg-black/45 md:hidden"
            onClick={() => setOpen(false)}
          />
          <aside className="fixed inset-y-14 left-0 z-[110] w-[286px] max-w-[86vw] overflow-y-auto border-r border-line bg-surface-0 p-4 shadow-xl md:hidden">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-fg-0">站务导航</p>
              <button
                type="button"
                aria-label="关闭站务导航"
                onClick={() => setOpen(false)}
                className="grid size-8 place-items-center rounded-sm text-fg-2 hover:bg-surface-2 hover:text-fg-0"
              >
                <X className="size-4" />
              </button>
            </div>
            <StaffNavGroups
              groups={groups}
              pathname={pathname}
              compact
              onNavigate={() => setOpen(false)}
            />
          </aside>
        </>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[232px_minmax(0,1fr)]">
        <aside className="hidden h-full min-h-0 overflow-y-auto overscroll-contain border-r border-line px-3 py-4 md:block">
          <StaffNavGroups groups={groups} pathname={pathname} />
        </aside>

        <main id="main" ref={mainRef} className="flex min-h-0 min-w-0 flex-col overflow-y-auto overscroll-contain">
          <div className="mx-auto w-full max-w-[1200px] flex-1 p-3 md:p-6">{children}</div>
          <SiteFooter variant="compact" />
        </main>
      </div>
    </div>
  );
}
