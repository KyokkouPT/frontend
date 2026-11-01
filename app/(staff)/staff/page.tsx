import Link from "next/link";
import { redirect } from "next/navigation";
import type { StaffSummaryResponse } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/ui/panel";
import { StatCard } from "@/components/ui/stat";

export const dynamic = "force-dynamic";

export const metadata = { title: "站务概览" };

export default async function StaffPage() {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect("/login?next=/staff");
  if (!bootstrap.permissions.includes("staff.access")) {
    return (
      <Panel title="无权访问">
        <Notice tone="warn">当前账号没有站务权限。</Notice>
      </Panel>
    );
  }

  let summary: StaffSummaryResponse;
  try {
    summary = await serverFetch<StaffSummaryResponse>("/api/v1/staff/summary");
  } catch (error) {
    const message =
      error instanceof ServerFetchError
        ? `后端返回 ${String(error.status)}：${error.message}`
        : error instanceof Error
          ? error.message
          : "无法连接后端";
    return (
      <Panel title="站务概览加载失败">
        <Notice tone="warn">{message}</Notice>
      </Panel>
    );
  }

  return (
    <>
      <PageHeader
        title="站务概览"
        description={`Schema v${String(summary.schema_version)} · 数据来自真实队列`}
      />
      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-5">
        <StatCard label="待审核" value={String(summary.pending_review)} tone="accent" />
        <StatCard label="待处理举报" value={String(summary.open_reports)} />
        <StatCard label="异常" value={String(summary.anomalies)} />
        <StatCard label="用户" value={String(summary.users)} />
        <StatCard label="已通过种子" value={String(summary.torrents)} />
      </div>
      <Panel title="常用入口">
        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          {[
            ["审核台", "/staff/review"],
            ["举报", "/staff/reports"],
            ["用户管理", "/staff/users"],
            ["等级管理", "/staff/classes"],
            ["等级规则", "/staff/classes/rules"],
            ["反作弊", "/staff/anomalies"],
            ["审计日志", "/staff/audit"],
            ["申诉", "/staff/appeals"],
          ].map(([label, href]) => (
            <li key={href}>
              <Link href={href ?? "/staff"} className="text-accent hover:underline">
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
