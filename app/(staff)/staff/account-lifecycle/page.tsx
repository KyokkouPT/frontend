import { redirect } from "next/navigation";
import type { AccountLifecycleSettings } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { serverFetch, ServerFetchError } from "@/lib/api/server";
import { ParkingPolicy } from "@/components/account-parking";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";
export const metadata = { title: "账号生命周期" };
export default async function AccountLifecyclePage() {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect("/login?next=/staff/account-lifecycle");
  if (!bootstrap.permissions.includes("staff.settings")) return <Notice tone="warn">没有站点设置权限。</Notice>;
  try {
    const result = await serverFetch<{ settings: AccountLifecycleSettings }>("/api/v1/staff/account-lifecycle");
    return <><PageHeader title="账号生命周期" description="配置账号停放；策略默认关闭，变更写入审计。" /><ParkingPolicy initial={result.settings} /></>;
  } catch (error) { return <Notice tone="warn">{error instanceof ServerFetchError ? error.message : "账号策略加载失败，请稍后重试"}</Notice>; }
}
