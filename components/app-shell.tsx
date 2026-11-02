"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { TopBar } from "./top-bar";
import { Sidebar } from "./sidebar";
import { SiteFooter } from "./site-footer";
import { MobileTabBar } from "./mobile-tab-bar";

/** 全站骨架：固定顶栏 + 独立滚动侧栏 + 独立滚动内容区。 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // 只重置右侧内容滚动；左侧导航保持原滚动位置。
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <TopBar />
      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[64px_minmax(0,1fr)] xl:grid-cols-[224px_minmax(0,1fr)]">
        <Sidebar />
        <main
          id="main"
          ref={mainRef}
          className="flex min-h-0 min-w-0 flex-col overflow-y-auto overscroll-contain pb-[calc(3.75rem+env(safe-area-inset-bottom))] md:pb-0"
        >
          <div className="mx-auto w-full max-w-[1440px] flex-1 p-3 md:p-6">{children}</div>
          <SiteFooter />
        </main>
      </div>
      <MobileTabBar />
    </div>
  );
}
