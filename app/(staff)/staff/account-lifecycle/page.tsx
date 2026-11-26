import { redirect } from "next/navigation";
import type { AccountLifecycleSettings, InactivityPolicy, InactivityPreviewResponse, LifecycleMailStatus } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { serverFetch, ServerFetchError } from "@/lib/api/server";
import { ParkingPolicy } from "@/components/account-parking";
import { AccountLifecyclePreview } from "@/components/account-lifecycle-preview";
import { LifecycleMailPolicy } from "@/components/lifecycle-mail-policy";
import type { AccountErasureSettings, AccountErasurePreviewResponse } from "@kyokkou/contracts";
import { AccountErasurePolicy } from "@/components/account-erasure-policy";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";
export const metadata = { title: "账号生命周期" };
export default async function AccountLifecyclePage() {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect("/login?next=/staff/account-lifecycle");
  if (!bootstrap.permissions.includes("staff.settings")) return <Notice tone="warn">没有站点设置权限。</Notice>;
  try {
    const [result, inactivity, state, mail, erasure, erasureState] = await Promise.all([
      serverFetch<{ settings: AccountLifecycleSettings }>("/api/v1/staff/account-lifecycle"),
      serverFetch<InactivityPolicy>("/api/v1/staff/account-inactivity"),
      serverFetch<InactivityPreviewResponse>("/api/v1/staff/account-inactivity/preview"),
      serverFetch<LifecycleMailStatus>("/api/v1/staff/account-lifecycle/email"),
      serverFetch<AccountErasureSettings>("/api/v1/staff/account-erasure"),
      serverFetch<AccountErasurePreviewResponse>("/api/v1/staff/account-erasure/preview"),
    ]);
    return <><PageHeader title="账号生命周期" description="配置账号停放、通知、停用与匿名化，查看豁免和执行状态。" /><div className="grid gap-5"><ParkingPolicy initial={result.settings} /><LifecycleMailPolicy initial={mail} /><AccountLifecyclePreview initial={inactivity} initialState={state} /><AccountErasurePolicy initial={erasure} initialState={erasureState} /></div></>;
  } catch (error) { return <Notice tone="warn">{error instanceof ServerFetchError ? error.message : "账号策略加载失败，请稍后重试"}</Notice>; }
}
