"use client";

import Link from "next/link";
import { Bell, Upload } from "lucide-react";
import { ThemeSwitch } from "./theme-switch";
import { UserMenu } from "./user-menu";
import { MobileNav } from "./mobile-nav";
import { BrandMark } from "./brand-mark";
import { useBootstrap } from "./providers/bootstrap-provider";

/**
 * 顶部栏：品牌、主导航、主题、用户菜单。
 * 站点名与导航来自 bootstrap；Phase 1 未实现搜索/通知页面，所以不渲染对应入口。
 */
export function TopBar() {
  const bootstrap = useBootstrap();
  const site = bootstrap?.site ?? null;
  const me = bootstrap?.me ?? null;
  const navItems = bootstrap?.nav.site.flatMap((group) => group.items) ?? [];
  const unread = bootstrap?.counts.unread ?? 0;
  const name = site?.name ?? "KyokkouPT";

  const topNav = navItems.filter((item) => item.href !== "/").slice(0, 3);

  return (
    <header className="sticky top-0 z-[100] flex h-14 shrink-0 items-center gap-2 border-b border-line bg-surface-0/86 px-3 backdrop-blur-md backdrop-saturate-150 md:gap-4 md:px-4">
      <MobileNav />

      <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2" aria-label={name}>
        <BrandMark />
        <span className="hidden max-w-[220px] truncate text-lg font-semibold tracking-[-0.01em] md:inline">
          {name}
        </span>
      </Link>

      {topNav.length > 0 && (
        <nav className="ml-auto hidden items-center gap-1 max-md:hidden" aria-label="主导航">
          {topNav.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="rounded-sm px-2.5 py-1.5 text-sm font-medium text-fg-1 transition-colors hover:bg-surface-2 hover:text-fg-0"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-0.5">
        {me && (
          <Link
            href="/upload"
            className="mr-1 inline-flex h-10 items-center gap-1.5 rounded-sm border border-accent bg-accent px-3 text-sm font-semibold text-accent-ink transition hover:brightness-110 md:h-[34px]"
          >
            <Upload className="size-4" />
            <span className="max-sm:hidden">发布</span>
          </Link>
        )}
        {unread > 0 && (
          <Link
            href="/notifications"
            aria-label={`通知（${String(unread)} 条未读）`}
            className="relative grid size-10 place-items-center rounded-sm text-fg-1 transition-colors hover:bg-surface-2 hover:text-fg-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:size-[34px]"
          >
            <Bell className="size-[18px]" />
            <span className="absolute top-[7px] right-2 size-1.5 rounded-pill bg-danger ring-2 ring-surface-0" />
          </Link>
        )}
        <ThemeSwitch />
        <UserMenu />
      </div>
    </header>
  );
}
