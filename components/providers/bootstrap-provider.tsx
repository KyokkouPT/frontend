"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Bootstrap } from "@kyokkou/contracts";

const BootstrapContext = createContext<Bootstrap | null>(null);

/** 首屏 bootstrap 的客户端分发点；布局在服务端取数据后包一层。 */
export function BootstrapProvider({
  bootstrap,
  children,
}: {
  bootstrap: Bootstrap | null;
  children: ReactNode;
}) {
  return <BootstrapContext.Provider value={bootstrap}>{children}</BootstrapContext.Provider>;
}

export function useBootstrap(): Bootstrap | null {
  return useContext(BootstrapContext);
}
