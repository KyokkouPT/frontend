import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { BootstrapProvider } from "@/components/providers/bootstrap-provider";
import { getBootstrap } from "@/lib/bootstrap";

/** 站点页面布局：服务端取 bootstrap，客户端壳通过 Provider 读取。 */
export default async function SiteLayout({ children }: { children: ReactNode }) {
  const bootstrap = await getBootstrap();

  return (
    <BootstrapProvider bootstrap={bootstrap}>
      <AppShell>{children}</AppShell>
    </BootstrapProvider>
  );
}
