"use client";

import type { ReactNode } from "react";
import { TopBar } from "./top-bar";
import { Sidebar } from "./sidebar";
import { SiteFooter } from "./site-footer";
import { MobileTabBar } from "./mobile-tab-bar";

/** 全站骨架：固定顶栏 + 侧栏（< md 隐藏）+ 底部标签栏（< md）+ 内容区 + 页脚。 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <TopBar />
      <div className="grid min-h-[calc(100dvh-3.5rem)] grid-cols-1 md:grid-cols-[64px_minmax(0,1fr)] xl:grid-cols-[224px_minmax(0,1fr)]">
        <Sidebar />
        <main
          id="main"
          className="flex min-w-0 flex-col pb-[calc(3.75rem+env(safe-area-inset-bottom))] md:pb-0"
        >
          <div className="mx-auto w-full max-w-[1440px] flex-1 p-3 md:p-6">{children}</div>
          <SiteFooter />
        </main>
      </div>
      <MobileTabBar />
    </>
  );
}
