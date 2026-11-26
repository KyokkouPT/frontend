import { redirect } from "next/navigation";
import type { LoginSecuritySettings, LoginEventsResponse, SharedIpsResponse } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { serverFetch, ServerFetchError } from "@/lib/api/server";
import { StaffLoginSecurity } from "@/components/staff-login-security";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";
export const metadata = { title: "登录安全" };
export default async function LoginSecurityPage() {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect("/login?next=/staff/login-security");
  if (!bootstrap.permissions.includes("staff.ip_view")) return <Notice tone="warn">没有 IP 查看权限。</Notice>;
  try {
    const [config, events, shared] = await Promise.all([
      serverFetch<{ settings: LoginSecuritySettings }>("/api/v1/staff/login-security"),
      serverFetch<LoginEventsResponse>("/api/v1/staff/login-events"), serverFetch<SharedIpsResponse>("/api/v1/staff/shared-ips"),
    ]);
    return <><PageHeader title="登录安全" description="配置失败限制、检查登录历史与重复 IP；只记录必要信息，不记录密码或动态验证码。" />
      <StaffLoginSecurity initial={config.settings} initialEvents={events} initialShared={shared} canEdit={bootstrap.permissions.includes("staff.settings")} /></>;
  } catch (error) { return <Notice tone="warn">{error instanceof ServerFetchError ? error.message : "登录安全数据加载失败，请稍后重试"}</Notice>; }
}
