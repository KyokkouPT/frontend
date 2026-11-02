import { redirect } from "next/navigation";
import type { StaffOperationsResponse } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { PageHeader } from "@/components/page-header";
import { Notice } from "@/components/notice";
import { OperationsEditor } from "@/components/operations-editor";
import { BonusFormulaPanel } from "@/components/bonus-formula-editor";
import { Panel } from "@/components/ui/panel";

export const dynamic = "force-dynamic";

export const metadata = { title: "运营设置" };

export default async function StaffOperationsPage() {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect("/login?next=/staff/operations");
  if (!bootstrap.permissions.includes("staff.operations")) {
    return (
      <Panel title="无权访问">
        <Notice tone="warn">当前账号没有运营设置权限。</Notice>
      </Panel>
    );
  }

  let data: StaffOperationsResponse;
  try {
    data = await serverFetch<StaffOperationsResponse>("/api/v1/staff/operations");
  } catch (error) {
    const message =
      error instanceof ServerFetchError
        ? `后端返回 ${String(error.status)}：${error.message}`
        : error instanceof Error
          ? error.message
          : "无法连接后端";
    return (
      <Panel title="运营设置加载失败">
        <Notice tone="warn">{message}</Notice>
      </Panel>
    );
  }

  return (
    <>
      <PageHeader
        title="运营设置"
        description="经济、魔力值商店、魔力值调度与做种积分公式；独立于站点基础设置。"
      />
      <div className="grid gap-6">
        <OperationsEditor initial={data.settings} />
        <BonusFormulaPanel
          initial={data.settings.bonus}
          savePath="/api/v1/staff/operations"
        />
        <BonusFormulaPanel
          initial={data.settings.seed_points}
          kind="seed_points"
          savePath="/api/v1/staff/operations"
        />
      </div>
    </>
  );
}
