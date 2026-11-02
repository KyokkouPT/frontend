import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { AssessmentAssignmentItem } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { formatDateTime } from "@/lib/format";
import { Breadcrumbs, PageHeader } from "@/components/page-header";
import { AssessmentProgressList } from "@/components/assessment-progress";
import { Markdown } from "@/components/markdown";
import { Notice } from "@/components/notice";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";

export const dynamic = "force-dynamic";

const STATUS_TEXT: Record<string, string> = {
  assigned: "已分配",
  claimed: "已领取",
  in_progress: "进行中",
  passed: "已通过",
  failed: "未通过",
  expired: "已过期",
  cancelled: "已取消",
};

export default async function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const assignmentId = Number(id);
  if (!Number.isInteger(assignmentId) || assignmentId <= 0) notFound();

  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect(`/login?next=${encodeURIComponent(`/assessments/${id}`)}`);

  let item: AssessmentAssignmentItem;
  try {
    item = await serverFetch<AssessmentAssignmentItem>(
      `/api/v1/me/assessments/${String(assignmentId)}`,
    );
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
      <Panel title="考核 / 任务加载失败">
        <Notice tone="warn">{message}</Notice>
      </Panel>
    );
  }

  const active = ["assigned", "claimed", "in_progress"].includes(item.status);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "首页", href: "/" },
          { label: "考核 / 任务", href: "/assessments" },
          { label: item.name },
        ]}
      />

      <PageHeader
        title={item.name}
        description={`${item.type === "exam" ? "考核" : "任务"} · ${formatDateTime(item.begin_at)} 至 ${formatDateTime(item.end_at)}`}
        actions={
          <Badge tone={item.status === "passed" ? "ok" : item.status === "failed" ? "danger" : "accent"}>
            {STATUS_TEXT[item.status] ?? item.status}
          </Badge>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="grid min-w-0 gap-6">
          <Panel title="说明">
            {item.description_markdown ? (
              <Markdown>{item.description_markdown}</Markdown>
            ) : (
              <p className="text-sm text-fg-2">没有额外说明。</p>
            )}
          </Panel>

          <Panel title="进度" description={active ? "每 10 分钟刷新一次" : "最终进度"}>
            <AssessmentProgressList items={item.progress} />
          </Panel>

          {item.result_reason && (
            <Panel title="结果">
              <p className="text-sm text-fg-1">{item.result_reason}</p>
            </Panel>
          )}
        </div>

        <div className="grid gap-6">
          <Panel title="奖励">
            <dl className="grid gap-2 text-sm">
              <Row label="魔力" value={String(item.reward.bonus)} />
              <Row label="邀请" value={String(item.reward.invite)} />
              <Row label="等级" value={item.reward.class_slug ?? "—"} />
              <Row label="头衔" value={item.reward.custom_title ?? "—"} />
            </dl>
          </Panel>

          <Panel title="失败处罚">
            <dl className="grid gap-2 text-sm">
              <Row label="扣魔力" value={String(item.penalty.bonus)} />
              <Row label="扣邀请" value={String(item.penalty.invite)} />
              <Row label="警告" value={String(item.penalty.warn)} />
              <Row label="降级" value={item.penalty.class_slug ?? "—"} />
              <Row label="停用天数" value={String(item.penalty.suspend_days)} />
              <Row label="封禁" value={item.penalty.ban ? "是" : "否"} />
            </dl>
          </Panel>

          <Link href="/assessments" className="text-sm text-accent hover:underline">
            ← 返回考核 / 任务
          </Link>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-3 border-b border-line/60 pb-2 last:border-0">
      <dt className="text-xs text-fg-2">{label}</dt>
      <dd className="ml-auto font-mono text-[13px]">{value}</dd>
    </div>
  );
}
