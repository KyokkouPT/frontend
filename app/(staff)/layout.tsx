import type { ReactNode } from "react";
import { StaffShell } from "@/components/staff-shell";
import { BootstrapProvider } from "@/components/providers/bootstrap-provider";
import { getBootstrap } from "@/lib/bootstrap";

/** 站务页面布局；具体页面负责校验 staff 权限并决定 404/登录。 */
export default async function StaffLayout({ children }: { children: ReactNode }) {
  const bootstrap = await getBootstrap();

  return (
    <BootstrapProvider bootstrap={bootstrap}>
      <StaffShell>{children}</StaffShell>
    </BootstrapProvider>
  );
}
