import { redirect } from "next/navigation";
import type { StaffSettingsResponse } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { SettingsEditor } from "@/components/staff-config";
import { ClassSchedulerPanel } from "@/components/class-scheduler-panel";
import { Panel } from "@/components/ui/panel";

export const dynamic = "force-dynamic";

export const metadata = { title: "站点设置" };

export default async function StaffSettingsPage() {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect("/login?next=/staff/settings");
  if (!bootstrap.permissions.includes("staff.settings")) {
    return (
      <Panel title="无权访问">
        <Notice tone="warn">只有管理员可以修改站点设置。</Notice>
      </Panel>
    );
  }

  let data: StaffSettingsResponse;
  try {
    data = await serverFetch<StaffSettingsResponse>("/api/v1/staff/settings");
  } catch (error) {
    const message =
      error instanceof ServerFetchError
        ? `后端返回 ${String(error.status)}：${error.message}`
        : error instanceof Error
          ? error.message
          : "无法连接后端";
    return (
      <Panel title="设置加载失败">
        <Notice tone="warn">{message}</Notice>
      </Panel>
    );
  }

  return (
    <>
      <PageHeader
        title="站点设置"
        description="保存后立即影响 bootstrap、注册、Tracker 与经济；写入审计日志（settings.update）。"
      />
      <SettingsEditor initial={data.settings} />
      <div className="mt-6 grid gap-6">
        <ClassSchedulerPanel initial={data.settings.classes} />
      </div>
    </>
  );
}
