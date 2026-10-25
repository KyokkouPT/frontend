import { redirect } from "next/navigation";
import type { MeResponse } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { PageHeader } from "@/components/page-header";
import { Notice } from "@/components/notice";
import { SnatchTable } from "@/components/snatch-table";
import { Panel } from "@/components/ui/panel";

export const dynamic = "force-dynamic";

export const metadata = { title: "做种" };

export default async function SeedingPage() {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect("/login?next=/me/seeding");

  let me: MeResponse;
  try {
    me = await serverFetch<MeResponse>("/api/v1/me");
  } catch (error) {
    const message =
      error instanceof ServerFetchError
        ? `后端返回 ${String(error.status)}：${error.message}`
        : error instanceof Error
          ? error.message
          : "无法连接后端";
    return (
      <Panel title="做种列表加载失败">
        <Notice tone="warn">{message}</Notice>
      </Panel>
    );
  }

  const rows = me.snatches.filter((row) => row.status === "seeding");

  return (
    <>
      <PageHeader
        title="我的做种"
        count={`${String(rows.length)} 个`}
        description={`每小时产出 ${me.bonus_yield_per_hour.toFixed(2)} 魔力值；数据来自 Tracker announce。`}
      />
      <Panel flush>
        <SnatchTable
          rows={rows}
          emptyTitle="还没有做种记录"
          emptyDescription="客户端使用个人 .torrent 向 Tracker announce 后会出现在这里。"
        />
      </Panel>
    </>
  );
}
