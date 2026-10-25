import { redirect } from "next/navigation";
import type { AnomaliesResponse } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { AnomalyActions } from "@/components/staff-actions";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { formatRelativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "反作弊" };

export default async function StaffAnomaliesPage() {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect("/login?next=/staff/anomalies");
  if (!bootstrap.permissions.includes("staff.anomalies")) {
    return (
      <Panel title="无权访问">
        <Notice tone="warn">当前账号没有反作弊权限。</Notice>
      </Panel>
    );
  }

  let data: AnomaliesResponse;
  try {
    data = await serverFetch<AnomaliesResponse>("/api/v1/staff/anomalies");
  } catch (error) {
    const message =
      error instanceof ServerFetchError
        ? `后端返回 ${String(error.status)}：${error.message}`
        : error instanceof Error
          ? error.message
          : "无法连接后端";
    return (
      <Panel title="反作弊列表加载失败">
        <Notice tone="warn">{message}</Notice>
      </Panel>
    );
  }

  return (
    <>
      <PageHeader
        title="反作弊"
        description="冻结收益或封禁都会通知用户并写入审计；冻结期间产出为 0、不能兑换。"
      />
      <Panel flush>
        {data.items.length === 0 ? (
          <p className="p-4 text-sm text-fg-2">暂无异常记录。</p>
        ) : (
          <ul className="divide-y divide-line">
            {data.items.map((anomaly) => (
              <li key={anomaly.id} className="grid gap-2 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Avatar
                    name={anomaly.user.name}
                    hue={anomaly.user.hue}
                    size="sm"
                    initial={anomaly.user.name.slice(0, 1)}
                  />
                  <b className="text-sm">{anomaly.user.name}</b>
                  <Badge tone="warn">{anomaly.kind}</Badge>
                  <Badge tone={anomaly.severity === "high" ? "danger" : "default"}>
                    {anomaly.severity}
                  </Badge>
                  <Badge tone={anomaly.status === "open" ? "warn" : "ok"}>{anomaly.status}</Badge>
                  <span className="text-2xs text-fg-2">{formatRelativeTime(anomaly.created_at)}</span>
                </div>
                {anomaly.detail && (
                  <p className="break-all text-xs text-fg-2">{anomaly.detail}</p>
                )}
                <AnomalyActions anomaly={anomaly} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
