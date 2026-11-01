import Link from "next/link";
import { redirect } from "next/navigation";
import type { ClassHistoryResponse } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { formatDate } from "@/lib/format";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Panel } from "@/components/ui/panel";

export const dynamic = "force-dynamic";

export const metadata = { title: "等级历史" };

const SOURCE_LABEL: Record<string, string> = {
  auto: "自动",
  manual: "手动",
  system: "系统",
};

export default async function ClassHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ user_id?: string; cursor?: string }>;
}) {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect("/login?next=/staff/classes/history");
  if (!bootstrap.permissions.includes("staff.class_history")) {
    return (
      <Panel title="无权访问">
        <Notice tone="warn">当前账号没有等级历史权限（staff.class_history）。</Notice>
      </Panel>
    );
  }

  const params = await searchParams;
  const userId = params.user_id?.trim() ?? "";
  const cursor = params.cursor?.trim() ?? "";
  const query = new URLSearchParams();
  if (userId) query.set("user_id", userId);
  if (cursor) query.set("cursor", cursor);
  const suffix = query.toString();

  let data: ClassHistoryResponse;
  try {
    data = await serverFetch<ClassHistoryResponse>(
      `/api/v1/staff/classes/history${suffix ? `?${suffix}` : ""}`,
    );
  } catch (error) {
    const message =
      error instanceof ServerFetchError
        ? `后端返回 ${String(error.status)}：${error.message}`
        : error instanceof Error
          ? error.message
          : "无法连接后端";
    return (
      <Panel title="等级历史加载失败">
        <Notice tone="warn">{message}</Notice>
      </Panel>
    );
  }

  return (
    <>
      <PageHeader
        title="等级历史"
        description="自动重算与手动调整都会记录；按用户 ID 过滤，游标分页。"
        actions={
          <Link href="/staff/classes" className="text-xs text-accent hover:underline">
            返回等级管理
          </Link>
        }
      />

      <Panel flush>
        <form className="flex flex-wrap items-center gap-2 border-b border-line p-3" action="/staff/classes/history" method="get">
          <Input
            name="user_id"
            defaultValue={userId}
            placeholder="用户 ID（留空看全部）"
            inputMode="numeric"
            className="h-9 max-w-[200px]"
          />
          <Button type="submit" variant="primary">
            筛选
          </Button>
          {userId && (
            <Link href="/staff/classes/history" className="text-xs text-fg-2 hover:text-accent">
              清除
            </Link>
          )}
        </form>

        {data.items.length === 0 ? (
          <p className="p-4 text-sm text-fg-2">暂无等级变更记录。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs text-fg-2">
                  <th className="px-4 py-2.5 font-medium">时间</th>
                  <th className="px-3 py-2.5 font-medium">用户</th>
                  <th className="px-3 py-2.5 font-medium">变更</th>
                  <th className="px-3 py-2.5 font-medium">来源</th>
                  <th className="px-3 py-2.5 font-medium">操作者</th>
                  <th className="px-4 py-2.5 font-medium">原因</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3 text-xs text-fg-2">{formatDate(item.created_at)}</td>
                    <td className="px-3 py-3">
                      <Link href={`/staff/users/${String(item.user_id)}`} className="text-sm font-medium hover:text-accent">
                        {item.username ?? `#${String(item.user_id)}`}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      {item.from_class ?? "—"} → <b className="font-medium">{item.to_class}</b>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={item.source === "manual" ? "accent" : item.source === "auto" ? "ok" : "muted"}>
                        {SOURCE_LABEL[item.source] ?? item.source}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-xs text-fg-2">{item.actor ?? "系统"}</td>
                    <td className="px-4 py-3 text-xs text-fg-1">{item.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-line p-3 text-xs">
          <span className="text-fg-2">共 {data.items.length} 条</span>
          {data.next_cursor !== null ? (
            <Link
              href={`/staff/classes/history?${new URLSearchParams({
                ...(userId ? { user_id: userId } : {}),
                cursor: String(data.next_cursor),
              }).toString()}`}
              className="text-accent hover:underline"
            >
              下一页 →
            </Link>
          ) : (
            <span className="text-fg-2">没有更多</span>
          )}
        </div>
      </Panel>
    </>
  );
}
