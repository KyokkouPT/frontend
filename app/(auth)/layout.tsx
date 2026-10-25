import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { getBootstrap } from "@/lib/bootstrap";
import { getSetupStatus } from "@/lib/setup";

/** 认证页布局：左侧品牌面板 + 右侧表单。 */
export default async function AuthLayout({ children }: { children: ReactNode }) {
  const setup = await getSetupStatus();
  if (setup.requires_setup) redirect("/setup");

  const bootstrap = await getBootstrap();

  return <AuthShell site={bootstrap?.site ?? null}>{children}</AuthShell>;
}
