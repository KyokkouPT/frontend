import { cache } from "react";
import type { Bootstrap } from "@kyokkou/contracts";
import { serverFetch } from "./api/server";

/**
 * 首屏 bootstrap：site / nav / sections / permissions / counts / me。
 * 失败返回 null，由布局渲染最小 fallback（不伪造业务数据）。
 */
export const getBootstrap = cache(async (): Promise<Bootstrap | null> => {
  try {
    return await serverFetch<Bootstrap>("/api/v1/bootstrap");
  } catch {
    return null;
  }
});
