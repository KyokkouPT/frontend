"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { isNavItemActive } from "@/lib/nav";
import { navIcon } from "@/lib/nav-icons";
import { cn } from "@/lib/cn";
import { BrandMark } from "./brand-mark";
import { ThemeSwitch } from "./theme-switch";
import { UserMenu } from "./user-menu";
import { SiteFooter } from "./site-footer";
import { Badge } from "./ui/badge";
import { useBootstrap } from "./providers/bootstrap-provider";

/** 站务后台骨架：独立顶栏语境 + 自己的导航，与站点壳共用同一套 token。 */
export function StaffShell({ children }: { children: ReactNode }) {
  const bootstrap = useBootstrap();
  const pathname = usePathname() ?? "/";
  const items = bootstrap?.nav.staff.flatMap((group) => group.items) ?? [];

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-[100] flex h-14 items-center gap-3 border-b border-line bg-surface-0/86 px-3 backdrop-blur-md backdrop-saturate-150 md:px-4">
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

      <div className="grid min-h-[calc(100dvh-3.5rem)] grid-cols-1 md:grid-cols-[208px_minmax(0,1fr)]">
        <aside className="hidden border-r border-line p-3 md:block">
          <nav className="grid gap-1" aria-label="站务导航">
            {items.map((item) => {
              const active = isNavItemActive(item, pathname);
              const Icon = navIcon(item.icon);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-9 items-center gap-2.5 rounded-sm px-3 text-sm font-medium transition-colors",
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
          </nav>
        </aside>

        <main id="main" className="flex min-w-0 flex-col">
          <div className="mx-auto w-full max-w-[1200px] flex-1 p-3 md:p-6">{children}</div>
          <SiteFooter variant="compact" />
        </main>
      </div>
    </div>
  );
}
