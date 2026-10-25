import { redirect } from "next/navigation";
import type { MeSettingsResponse, PreferencesResponse } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { AccountPanel, PreferencesPanel } from "@/components/settings-panels";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/ui/panel";

export const dynamic = "force-dynamic";

export const metadata = { title: "账号设置" };

export default async function SettingsPage() {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect("/login?next=/me/settings");

  let settings: MeSettingsResponse;
  let preferences: PreferencesResponse;
  try {
    [settings, preferences] = await Promise.all([
      serverFetch<MeSettingsResponse>("/api/v1/me/settings"),
      serverFetch<PreferencesResponse>("/api/v1/me/preferences"),
    ]);
  } catch (error) {
    const message =
      error instanceof ServerFetchError
        ? `后端返回 ${String(error.status)}：${error.message}`
        : error instanceof Error
          ? error.message
          : "无法连接后端";
    return (
      <Panel title="账号设置加载失败">
        <Notice tone="warn">{message}</Notice>
      </Panel>
    );
  }

  return (
    <>
      <PageHeader
        title="账号设置"
        description="管理密码、邮箱、两步验证、passkey、通知与隐私。"
      />
      <div className="grid gap-6">
        <AccountPanel settings={settings} />
        <PreferencesPanel initial={preferences} />
      </div>
    </>
  );
}
