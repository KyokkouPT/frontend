import type { ReactNode } from "react";
import { AuthShell } from "@/components/auth-shell";
import { getBootstrap } from "@/lib/bootstrap";

/** 认证页布局：左侧品牌面板 + 右侧表单。 */
export default async function AuthLayout({ children }: { children: ReactNode }) {
  const bootstrap = await getBootstrap();

  return <AuthShell site={bootstrap?.site ?? null}>{children}</AuthShell>;
}
