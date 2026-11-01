"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import type { NavItem } from "@kyokkou/contracts";
import { isNavItemActive } from "@/lib/nav";
import { navIcon } from "@/lib/nav-icons";
import { getNavOpen, setNavOpen, subscribeNav } from "@/lib/nav-store";
import { cn } from "@/lib/cn";
import { useBootstrap } from "./providers/bootstrap-provider";
import { ThemeSwitch } from "./theme-switch";

/** 与 CSS 过渡时长保持一致：关闭动画播完才卸载。 */
const EXIT_MS = 300;

/**
 * 移动端导航抽屉：< md 时侧栏隐藏，改为汉堡 + 全屏抽屉。
 * 入场由 CSS @starting-style 负责，不依赖 rAF。
 */
export function MobileNav() {
  const bootstrap = useBootstrap();
  const open = useSyncExternalStore(subscribeNav, getNavOpen, () => false);
  const [isClient, setIsClient] = useState(false);
  const [present, setPresent] = useState(false);
  const [shown, setShown] = useState(false);
  const pathname = usePathname() ?? "/";
  const siteGroups = bootstrap?.nav.site ?? [];
  const staffItems = (bootstrap?.nav.staff ?? []).flatMap((group) => group.items);
  const siteName = bootstrap?.site.name ?? "KyokkouPT";

  useEffect(() => setIsClient(true), []);

  // 路由变化自动收起
  useEffect(() => setNavOpen(false), [pathname]);

  useEffect(() => {
    if (open) {
      setPresent(true);
      setShown(true);
      return;
    }

    setShown(false);
    const timer = setTimeout(() => setPresent(false), EXIT_MS);
    return () => clearTimeout(timer);
  }, [open]);

  // 锁 <html> 滚动，配合 globals.css 的 scrollbar-gutter，避免视口横向跳动。
  useEffect(() => {
    if (!present) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [present]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNavOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const close = useCallback(() => setNavOpen(false), []);

  function linkClass(item: NavItem) {
    const active = isNavItemActive(item, pathname);
    return cn(
      "flex h-11 items-center gap-3 rounded-sm px-3 text-sm transition-colors",
      active
        ? "bg-accent/12 font-semibold text-accent"
        : "font-medium text-fg-1 hover:bg-surface-2 hover:text-fg-0",
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setNavOpen(true)}
        aria-label="打开导航"
        aria-expanded={open}
        className="grid size-10 shrink-0 place-items-center rounded-sm text-fg-1 transition-colors hover:bg-surface-2 hover:text-fg-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:size-[34px] md:hidden"
      >
        <Menu className="size-[18px]" />
      </button>

      {/* 顶栏有 backdrop-filter，fixed 后代会被困在 header 内，所以 portal 到 body */}
      {isClient &&
        present &&
        createPortal(
          <div className={cn("fixed inset-0 z-[300] md:hidden", !shown && "pointer-events-none")}>
            <button
              type="button"
              aria-label="关闭导航"
              onClick={close}
              tabIndex={shown ? 0 : -1}
              data-shown={shown}
              className="kp-drawer-mask absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            />

            <nav
              aria-label="站点导航"
              data-shown={shown}
              className={cn(
                "kp-drawer-panel absolute inset-y-0 left-0 flex w-[86%] max-w-[340px] flex-col overflow-y-auto",
                "border-r border-line bg-surface-0 shadow-[8px_0_32px_-12px_rgb(0_0_0/0.28)]",
              )}
            >
              <div className="flex items-center gap-2 border-b border-line px-3 py-3">
                <span className="truncate text-base font-semibold tracking-[-0.01em]">{siteName}</span>
                <button
                  type="button"
                  onClick={close}
                  aria-label="关闭"
                  className="ml-auto grid size-8 place-items-center rounded-sm text-fg-2 hover:bg-surface-2 hover:text-fg-0"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="grid gap-4 px-2 py-2">
                {siteGroups.map((group, groupIndex) => (
                  <div key={group.label ?? `group-${String(groupIndex)}`} className="grid gap-0.5">
                    {group.label && (
                      <p className="px-3 pb-1 text-2xs font-semibold tracking-[0.08em] text-fg-2 uppercase">
                        {group.label}
                      </p>
                    )}
                    <ul className="grid gap-0.5">
                      {group.items.map((item) => {
                        const Icon = navIcon(item.icon);
                        return (
                          <li key={item.key}>
                            <Link href={item.href} className={linkClass(item)} onClick={close}>
                              <Icon className="size-4 shrink-0 opacity-85" />
                              {item.label}
                              {item.badge && (
                                <span className="ml-auto rounded-[4px] bg-surface-2 px-1.5 py-0.5 font-mono text-2xs text-fg-2">
                                  {item.badge}
                                </span>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}

                {staffItems.length > 0 && (
                  <div className="grid gap-0.5 border-t border-line pt-3">
                    <p className="px-3 pb-1 text-2xs font-semibold tracking-[0.08em] text-fg-2 uppercase">
                      站务
                    </p>
                    <ul className="grid gap-0.5">
                      {staffItems.map((item) => {
                        const Icon = navIcon(item.icon);
                        return (
                          <li key={item.key}>
                            <Link href={item.href} className={linkClass(item)} onClick={close}>
                              <Icon className="size-4 shrink-0 opacity-85" />
                              {item.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {siteGroups.length === 0 && (
                  <p className="px-3 py-2 text-sm text-fg-2">
                    导航暂不可用，请确认后端已启动后刷新页面。
                  </p>
                )}
              </div>

              <div className="mt-auto grid gap-3 border-t border-line p-3">
                <div className="flex items-center justify-between text-sm text-fg-1">
                  <span>主题</span>
                  <ThemeSwitch />
                </div>
                {bootstrap?.me ? (
                  <div className="flex items-center justify-between text-sm text-fg-1">
                    <span className="truncate">已登录：{bootstrap.me.username}</span>
                    <Link href="/me" onClick={close} className="text-accent hover:underline">
                      我的
                    </Link>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    onClick={close}
                    className="flex h-10 items-center justify-center rounded-sm border border-line bg-surface-1 text-[13px] text-fg-1 transition-colors hover:border-line-strong hover:text-fg-0"
                  >
                    登录
                  </Link>
                )}
              </div>
            </nav>
          </div>,
          document.body,
        )}
    </>
  );
}
