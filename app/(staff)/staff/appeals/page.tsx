import { redirect } from "next/navigation";
import type { AppealsResponse } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { AppealActions } from "@/components/staff-actions";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { formatRelativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "申诉处理" };

const KIND_LABEL: Record<string, string> = {
  bonus_freeze: "收益冻结",
  ban: "封禁",
  other: "其他",
};

export default async function StaffAppealsPage() {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect("/login?next=/staff/appeals");
  if (!bootstrap.permissions.includes("staff.appeals")) {
    return (
      <Panel title="无权访问">
        <Notice tone="warn">当前账号没有申诉处理权限。</Notice>
      </Panel>
    );
  }

  let data: AppealsResponse;
  try {
    data = await serverFetch<AppealsResponse>("/api/v1/staff/appeals");
  } catch (error) {
    const message =
      error instanceof ServerFetchError
        ? `后端返回 ${String(error.status)}：${error.message}`
        : error instanceof Error
          ? error.message
          : "无法连接后端";
    return (
      <Panel title="申诉列表加载失败">
        <Notice tone="warn">{message}</Notice>
      </Panel>
    );
  }

  return (
    <>
      <PageHeader
        title="申诉处理"
        description="通过封禁申诉会恢复账号；通过收益冻结申诉会立即解除冻结。处理会通知用户并写审计。"
      />
      <Panel flush>
        {data.items.length === 0 ? (
          <p className="p-4 text-sm text-fg-2">暂无申诉。</p>
        ) : (
          <ul className="divide-y divide-line">
            {data.items.map((appeal) => (
              <li key={appeal.id} className="grid gap-2 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={appeal.status === "open" ? "warn" : "ok"}>{appeal.status}</Badge>
                  <Badge tone="default">{KIND_LABEL[appeal.kind] ?? appeal.kind}</Badge>
                  <b className="text-sm">{appeal.user.name}</b>
                  <span className="text-2xs text-fg-2">{formatRelativeTime(appeal.created_at)}</span>
                </div>
                <p className="text-sm leading-relaxed">{appeal.reason}</p>
                {appeal.messages.length > 0 && (
                  <ul className="grid gap-1 rounded-md bg-surface-2 p-2">
                    {appeal.messages.map((message) => (
                      <li key={`${String(appeal.id)}-${String(message.created_at)}`} className="text-xs">
                        <b className="text-fg-1">{message.author ?? "系统"}</b>
                        <span className="ml-1 text-fg-2">{formatRelativeTime(message.created_at)}</span>
                        <p className="mt-0.5 leading-relaxed text-fg-1">{message.body}</p>
                      </li>
                    ))}
                  </ul>
                )}
                {appeal.resolution_note && (
                  <p className="text-xs text-fg-2">处理说明：{appeal.resolution_note}</p>
                )}
                <AppealActions appeal={appeal} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
