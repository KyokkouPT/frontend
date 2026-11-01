import { redirect } from "next/navigation";
import type { StaffExchangeItemsResponse } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { StaffBonusItems } from "@/components/staff-bonus-items";
import { Panel } from "@/components/ui/panel";

export const dynamic = "force-dynamic";

export const metadata = { title: "魔力值商店管理" };

export default async function StaffBonusPage() {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect("/login?next=/staff/bonus");
  if (!bootstrap.permissions.includes("staff.bonus_shop")) {
    return (
      <Panel title="无权访问">
        <Notice tone="warn">当前账号没有魔力值商店管理权限。</Notice>
      </Panel>
    );
  }

  let data: StaffExchangeItemsResponse;
  try {
    data = await serverFetch<StaffExchangeItemsResponse>("/api/v1/staff/bonus/items");
  } catch (error) {
    const message =
      error instanceof ServerFetchError
        ? `后端返回 ${String(error.status)}：${error.message}`
        : error instanceof Error
          ? error.message
          : "无法连接后端";
    return (
      <Panel title="商店加载失败">
        <Notice tone="warn">{message}</Notice>
      </Panel>
    );
  }

  return (
    <>
      <PageHeader
        title="魔力值商店管理"
        description="管理兑换与回收项；历史兑换以类型和参数记录，不受后续编辑影响。"
      />
      <StaffBonusItems initial={data.items} />
    </>
  );
}
