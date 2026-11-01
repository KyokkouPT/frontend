import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { NotificationItem } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { formatDateTime, formatRelativeTime } from "@/lib/format";
import { Breadcrumbs, PageHeader } from "@/components/page-header";
import { Markdown } from "@/components/markdown";
import { Notice } from "@/components/notice";
import { Panel } from "@/components/ui/panel";

export const dynamic = "force-dynamic";

export const metadata = { title: "通知详情" };

export default async function NotificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const notificationId = Number(id);
  if (!Number.isInteger(notificationId) || notificationId <= 0) notFound();

  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect(`/login?next=${encodeURIComponent(`/notifications/${id}`)}`);

  let item: NotificationItem;
  try {
    item = await serverFetch<NotificationItem>(`/api/v1/notifications/${String(notificationId)}`);
  } catch (error) {
    if (error instanceof ServerFetchError && error.status === 404) notFound();
    if (error instanceof ServerFetchError && error.status === 401) redirect("/login");
    const message =
      error instanceof ServerFetchError
        ? `后端返回 ${String(error.status)}：${error.message}`
        : error instanceof Error
          ? error.message
          : "无法连接后端";
    return (
      <Panel title="通知加载失败">
        <Notice tone="warn">{message}</Notice>
      </Panel>
    );
  }

  // 打开详情即视为已读；使用页面请求里的 CSRF cookie 完成服务端标记。
  if (item.read_at === null) {
    const csrf = (await cookies()).get("kp_csrf")?.value;
    if (csrf) {
      try {
        await serverFetch(`/api/v1/notifications/${String(notificationId)}/read`, {
          method: "POST",
          headers: { "x-csrf-token": csrf },
        });
      } catch {
        /* 通知仍可阅读；标记已读失败不阻塞页面 */
      }
    }
  }

  const link = item.link_url;
  const linkIsInternal = link?.startsWith("/") && !link.startsWith("//");

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "首页", href: "/" },
          { label: "通知", href: "/notifications" },
          { label: "详情" },
        ]}
      />

      <PageHeader
        title={item.title}
        description={`${formatDateTime(item.created_at)} · ${formatRelativeTime(item.created_at)} · ${item.kind}`}
      />

      <Panel>
        <Markdown className="text-sm">{item.body}</Markdown>
        {link && (
          <div className="mt-5 border-t border-line pt-4">
            {linkIsInternal ? (
              <Link href={link} className="text-sm font-medium text-accent hover:underline">
                查看相关页面 →
              </Link>
            ) : (
              <a
                href={link}
                target="_blank"
                rel="noreferrer noopener"
                className="text-sm font-medium text-accent hover:underline"
              >
                打开相关链接 →
              </a>
            )}
          </div>
        )}
      </Panel>

      <div className="mt-5">
        <Link href="/notifications" className="text-sm text-accent hover:underline">
          ← 返回通知列表
        </Link>
      </div>
    </>
  );
}
