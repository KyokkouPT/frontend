import { redirect } from "next/navigation";
import type { ReportsResponse } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { ReportActions } from "@/components/staff-actions";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { formatRelativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "举报" };

export default async function StaffReportsPage() {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect("/login?next=/staff/reports");
  if (!bootstrap.permissions.includes("staff.reports")) {
    return (
      <Panel title="无权访问">
        <Notice tone="warn">当前账号没有举报处理权限。</Notice>
      </Panel>
    );
  }

  let data: ReportsResponse;
  try {
    data = await serverFetch<ReportsResponse>("/api/v1/staff/reports");
  } catch (error) {
    const message =
      error instanceof ServerFetchError
        ? `后端返回 ${String(error.status)}：${error.message}`
        : error instanceof Error
          ? error.message
          : "无法连接后端";
    return (
      <Panel title="举报加载失败">
        <Notice tone="warn">{message}</Notice>
      </Panel>
    );
  }

  return (
    <>
      <PageHeader title="举报" description="处理后会通知举报人；处理动作写入审计日志。" />
      <Panel flush>
        {data.items.length === 0 ? (
          <p className="p-4 text-sm text-fg-2">暂无举报。</p>
        ) : (
          <ul className="divide-y divide-line">
            {data.items.map((report) => (
              <li key={report.id} className="grid gap-2 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={report.status === "open" ? "warn" : "ok"}>
                    {report.status === "open" ? "待处理" : report.status === "resolved" ? "已成立" : "已驳回"}
                  </Badge>
                  <b className="text-sm">{report.target_label}</b>
                  <span className="text-2xs text-fg-2">
                    {report.target_type === "torrent" ? "种子" : "用户"} · {report.reporter ?? "未知"} ·{" "}
                    {formatRelativeTime(report.created_at)}
                  </span>
                </div>
                <p className="text-xs text-fg-1">
                  原因：{report.reason}
                  {report.detail ? ` · ${report.detail}` : ""}
                </p>
                <ReportActions report={report} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
