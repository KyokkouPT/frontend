import type { TopResponse } from "@kyokkou/contracts";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { TopBoards } from "@/components/top-boards";
import { Panel } from "@/components/ui/panel";

export const dynamic = "force-dynamic";

export const metadata = { title: "排行" };

export default async function TopPage() {
  let data: TopResponse;
  try {
    data = await serverFetch<TopResponse>("/api/v1/top");
  } catch (error) {
    const message =
      error instanceof ServerFetchError
        ? `后端返回 ${String(error.status)}：${error.message}`
        : error instanceof Error
          ? error.message
          : "无法连接后端";
    return (
      <>
        <PageHeader title="排行" description="用户与种子榜单。" />
        <Panel title="排行加载失败">
          <Notice tone="warn">{message}</Notice>
        </Panel>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="排行"
        description="按上传量、魔力值、做种时长与种子表现排序；数据来自真实统计。"
      />
      <TopBoards data={data} />
    </>
  );
}
