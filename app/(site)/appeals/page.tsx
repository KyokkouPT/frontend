import { redirect } from "next/navigation";
import type { AppealsResponse } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { AppealsPanel } from "@/components/appeals-panel";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/ui/panel";

export const dynamic = "force-dynamic";

export const metadata = { title: "申诉" };

export default async function AppealsPage() {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect("/login?next=/appeals");

  let data: AppealsResponse;
  try {
    data = await serverFetch<AppealsResponse>("/api/v1/me/appeals");
  } catch (error) {
    const message =
      error instanceof ServerFetchError
        ? `后端返回 ${String(error.status)}：${error.message}`
        : error instanceof Error
          ? error.message
          : "无法连接后端";
    return (
      <Panel title="申诉加载失败">
        <Notice tone="warn">{message}</Notice>
      </Panel>
    );
  }

  return (
    <>
      <PageHeader
        title="申诉"
        description="对收益冻结、账号状态或其他处理有异议时，可以在这里说明；Staff 处理后会通知。"
      />
      <AppealsPanel initial={data.items} />
    </>
  );
}
