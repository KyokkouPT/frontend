import Link from "next/link";
import { redirect } from "next/navigation";
import type { AuditResponse } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { formatRelativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "审计日志" };

export default async function StaffAuditPage() {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect("/login?next=/staff/audit");
  if (!bootstrap.permissions.includes("staff.audit")) {
    return (
      <Panel title="无权访问">
        <Notice tone="warn">当前账号没有审计日志权限。</Notice>
      </Panel>
    );
  }

  let data: AuditResponse;
  try {
    data = await serverFetch<AuditResponse>("/api/v1/staff/audit");
  } catch (error) {
    const message =
      error instanceof ServerFetchError
        ? `后端返回 ${String(error.status)}：${error.message}`
        : error instanceof Error
          ? error.message
          : "无法连接后端";
    return (
      <Panel title="审计日志加载失败">
        <Notice tone="warn">{message}</Notice>
      </Panel>
    );
  }

  return (
    <>
      <PageHeader
        title="审计日志"
        description="审核、用户状态、举报/反作弊、申诉与兑换都会写入审计；CSV 用于归档。"
      />

      <div className="mb-3 flex justify-end">
        <Link
          href="/api/v1/staff/audit/export"
          className="text-xs font-medium text-accent hover:underline"
        >
          下载 CSV
        </Link>
      </div>

      <Panel flush>
        {data.items.length === 0 ? (
          <p className="p-4 text-sm text-fg-2">暂无审计记录。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs text-fg-2">
                  <th className="px-4 py-2.5 font-medium">时间</th>
                  <th className="px-3 py-2.5 font-medium">操作者</th>
                  <th className="px-3 py-2.5 font-medium">动作</th>
                  <th className="px-3 py-2.5 font-medium">对象</th>
                  <th className="px-3 py-2.5 font-medium">IP</th>
                  <th className="px-4 py-2.5 font-medium">详情</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((entry) => (
                  <tr key={entry.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-2.5 text-xs text-fg-2">
                      {formatRelativeTime(entry.created_at)}
                    </td>
                    <td className="px-3 py-2.5 text-xs">{entry.actor ?? "系统"}</td>
                    <td className="px-3 py-2.5">
                      <Badge tone="accent">{entry.action}</Badge>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-2xs text-fg-2">
                      {entry.target_type ?? ""}
                      {entry.target_id ? `#${entry.target_id}` : ""}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-2xs text-fg-2">{entry.ip ?? ""}</td>
                    <td className="max-w-[260px] truncate px-4 py-2.5 font-mono text-2xs text-fg-2">
                      {entry.detail ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
