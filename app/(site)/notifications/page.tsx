import { redirect } from "next/navigation";
import type { NotificationsResponse } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { PageHeader } from "@/components/page-header";
import { Notice } from "@/components/notice";
import { NotificationsList } from "@/components/notifications-list";
import { Panel } from "@/components/ui/panel";

export const dynamic = "force-dynamic";

export const metadata = { title: "通知" };

export default async function NotificationsPage() {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect("/login?next=/notifications");

  let data: NotificationsResponse;
  try {
    data = await serverFetch<NotificationsResponse>("/api/v1/notifications");
  } catch (error) {
    const message =
      error instanceof ServerFetchError
        ? `后端返回 ${String(error.status)}：${error.message}`
        : error instanceof Error
          ? error.message
          : "无法连接后端";
    return (
      <>
        <PageHeader title="通知" description="审核结果与站内事件" />
        <Panel title="通知加载失败">
          <Notice tone="warn">{message}</Notice>
        </Panel>
      </>
    );
  }

  return (
    <>
      <PageHeader title="通知" description="审核结果与站内事件；站内通知始终保留。" />
      <NotificationsList initial={data} />
    </>
  );
}
