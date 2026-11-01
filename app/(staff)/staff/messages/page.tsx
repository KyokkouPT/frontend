import { redirect } from "next/navigation";
import type { StaffMessageOptions } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { StaffMessageComposer } from "@/components/staff-message-composer";
import { Panel } from "@/components/ui/panel";

export const dynamic = "force-dynamic";

export const metadata = { title: "群发站内信" };

export default async function StaffMessagesPage() {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect("/login?next=/staff/messages");
  if (!bootstrap.permissions.includes("staff.announcement")) {
    return (
      <Panel title="无权访问">
        <Notice tone="warn">当前账号没有站内信群发权限。</Notice>
      </Panel>
    );
  }

  let options: StaffMessageOptions;
  try {
    options = await serverFetch<StaffMessageOptions>("/api/v1/staff/messages/options");
  } catch (error) {
    const message =
      error instanceof ServerFetchError
        ? `后端返回 ${String(error.status)}：${error.message}`
        : error instanceof Error
          ? error.message
          : "无法连接后端";
    return (
      <Panel title="加载失败">
        <Notice tone="warn">{message}</Notice>
      </Panel>
    );
  }

  return (
    <>
      <PageHeader
        title="群发站内信"
        description="按等级条件、用户组或用户 ID 批量发送站内通知；空筛选即全体 active 用户。"
      />
      <StaffMessageComposer classes={options.classes} />
    </>
  );
}
