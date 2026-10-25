import type { RequestsResponse } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { RequestsBoard } from "@/components/requests-board";
import { Panel } from "@/components/ui/panel";

export const dynamic = "force-dynamic";

export const metadata = { title: "求种" };

export default async function RequestsPage() {
  const bootstrap = await getBootstrap();

  let data: RequestsResponse;
  try {
    data = await serverFetch<RequestsResponse>("/api/v1/requests");
  } catch (error) {
    const message =
      error instanceof ServerFetchError
        ? `后端返回 ${String(error.status)}：${error.message}`
        : error instanceof Error
          ? error.message
          : "无法连接后端";
    return (
      <>
        <PageHeader title="求种" description="发布悬赏，由 Staff 结算给交付者。" />
        <Panel title="求种列表加载失败">
          <Notice tone="warn">{message}</Notice>
        </Panel>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="求种"
        description="发布悬赏，由 Staff 指定交付者后结算；取消会退回冻结的魔力值。"
      />
      <RequestsBoard
        initial={data}
        meUsername={bootstrap?.me?.username ?? null}
        canSettle={bootstrap?.permissions.includes("staff.review") ?? false}
      />
    </>
  );
}
