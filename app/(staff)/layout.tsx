import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { StaffShell } from "@/components/staff-shell";
import { BootstrapProvider } from "@/components/providers/bootstrap-provider";
import { getBootstrap } from "@/lib/bootstrap";
import { getSetupStatus } from "@/lib/setup";

/** 站务页面布局；具体页面负责校验 staff 权限并决定 404/登录。 */
export default async function StaffLayout({ children }: { children: ReactNode }) {
  const setup = await getSetupStatus();
  if (setup.requires_setup) redirect("/setup");

  const bootstrap = await getBootstrap();

  return (
    <BootstrapProvider bootstrap={bootstrap}>
      <StaffShell>{children}</StaffShell>
    </BootstrapProvider>
  );
}
