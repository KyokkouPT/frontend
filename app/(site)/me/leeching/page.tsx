import { redirect } from "next/navigation";
import type { MeResponse } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { PageHeader } from "@/components/page-header";
import { Notice } from "@/components/notice";
import { SnatchTable } from "@/components/snatch-table";
import { Panel } from "@/components/ui/panel";

export const dynamic = "force-dynamic";

export const metadata = { title: "下载" };

export default async function LeechingPage() {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect("/login?next=/me/leeching");

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
      <Panel title="下载列表加载失败">
        <Notice tone="warn">{message}</Notice>
      </Panel>
    );
  }

  const rows = me.snatches.filter((row) => row.status === "leeching");

  return (
    <>
      <PageHeader
        title="正在下载"
        count={`${String(rows.length)} 个`}
        description="下载达到 H&R 阈值后会生成保种义务，注意在期限内完成。"
      />
      <Panel flush>
        <SnatchTable
          rows={rows}
          emptyTitle="没有正在下载的种子"
          emptyDescription="客户端开始下载并 announce 后会出现在这里。"
        />
      </Panel>
    </>
  );
}
