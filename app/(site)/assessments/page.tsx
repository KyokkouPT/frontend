import Link from "next/link";
import { redirect } from "next/navigation";
import type { AssessmentOfferItem, MyAssessmentsResponse } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Notice } from "@/components/notice";
import { AssessmentClaimButton } from "@/components/assessment-claim-button";
import { AssessmentProgressList } from "@/components/assessment-progress";
import { Markdown } from "@/components/markdown";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/panel";

export const dynamic = "force-dynamic";

export const metadata = { title: "考核 / 任务" };

const STATUS_TEXT: Record<string, string> = {
  assigned: "已分配",
  claimed: "已领取",
  in_progress: "进行中",
  passed: "已通过",
  failed: "未通过",
  expired: "已过期",
  cancelled: "已取消",
};

const METRIC_LABEL: Record<string, string> = {
  uploaded_delta: "上传增量",
  downloaded_delta: "下载增量",
  seedtime_delta: "做种时长增量",
  bonus_delta: "魔力增量",
  published_delta: "发布种子数",
  ratio: "分享率",
  last_active_days: "最近活跃天数",
  warnings: "警告次数",
  hnr_unfinished: "未完成 H&R",
};

function requirementText(item: AssessmentOfferItem["requirements"]["items"][number]): string {
  const label = METRIC_LABEL[item.metric] ?? item.metric;
  if (item.metric === "uploaded_delta" || item.metric === "downloaded_delta") {
    return `${label} ${item.op} ${item.value} GB`;
  }
  if (item.metric === "seedtime_delta") return `${label} ${item.op} ${item.value} 小时`;
  return `${label} ${item.op} ${item.value}`;
}

function OfferCard({ offer }: { offer: AssessmentOfferItem }) {
  return (
    <div className="rounded-md border border-line bg-surface-0 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <b className="text-sm font-semibold">{offer.name}</b>
        <Badge tone="accent">任务</Badge>
        {offer.end_at && (
          <span className="ml-auto text-2xs text-fg-2">
            截止 {formatDateTime(offer.end_at)}
          </span>
        )}
      </div>
      {offer.description_markdown && (
        <Markdown className="mt-2 text-xs">{offer.description_markdown}</Markdown>
      )}
      <ul className="mt-2 grid gap-1 text-xs text-fg-1">
        {offer.requirements.items.map((item) => (
          <li key={`${item.metric}-${item.op}-${String(item.value)}`}>
            · {requirementText(item)}
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-fg-2">
        <span>奖励：魔力 {offer.reward.bonus}</span>
        {offer.penalty.bonus > 0 && <span>失败扣魔力 {offer.penalty.bonus}</span>}
        <AssessmentClaimButton assessmentId={offer.id} />
      </div>
    </div>
  );
}

export default async function AssessmentsPage() {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect("/login?next=/assessments");

  let data: MyAssessmentsResponse;
  try {
    data = await serverFetch<MyAssessmentsResponse>("/api/v1/me/assessments");
  } catch (error) {
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

  const active = data.items.filter((item) =>
    ["assigned", "claimed", "in_progress"].includes(item.status),
  );
  const finished = data.items.filter((item) => !["assigned", "claimed", "in_progress"].includes(item.status));

  return (
    <>
      <PageHeader
        title="考核 / 任务"
        description="完成任务获得奖励；考核未通过可能产生处罚。进度每 10 分钟更新。"
      />

      <div className="grid gap-6">
        {data.available.length > 0 && (
          <Panel title="可领取任务" description="满足条件的任务可以自行领取">
            <div className="grid gap-3">
              {data.available.map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          </Panel>
        )}

        <Panel title="进行中" description="截止前完成所有要求即可通过">
          {active.length === 0 ? (
            <EmptyState title="当前没有进行中的考核或任务" description="领取任务后会显示在这里。" />
          ) : (
            <div className="grid gap-4">
              {active.map((item) => (
                <div key={item.id} className="rounded-md border border-line bg-surface-0 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <b className="text-sm font-semibold">{item.name}</b>
                    <Badge tone={item.type === "exam" ? "warn" : "accent"}>
                      {item.type === "exam" ? "考核" : "任务"}
                    </Badge>
                    <Badge tone="default">{STATUS_TEXT[item.status] ?? item.status}</Badge>
                    <span className="ml-auto text-2xs text-fg-2">
                      截止 {formatDateTime(item.end_at)}
                    </span>
                  </div>
                  <div className="mt-3">
                    <AssessmentProgressList items={item.progress} />
                  </div>
                  <Link
                    href={`/assessments/${String(item.id)}`}
                    className="mt-3 inline-block text-xs text-accent hover:underline"
                  >
                    查看详情 →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="已完成 / 已结束">
          {finished.length === 0 ? (
            <EmptyState title="暂无历史记录" description="通过、未通过或取消的考核会出现在这里。" />
          ) : (
            <div className="grid gap-2">
              {finished.map((item) => (
                <Link
                  key={item.id}
                  href={`/assessments/${String(item.id)}`}
                  className="flex flex-wrap items-center gap-2 rounded-sm border border-line/60 px-3 py-2 text-sm hover:border-line-strong"
                >
                  <span className="font-medium">{item.name}</span>
                  <Badge tone={item.status === "passed" ? "ok" : item.status === "failed" ? "danger" : "muted"}>
                    {STATUS_TEXT[item.status] ?? item.status}
                  </Badge>
                  <span className="ml-auto text-2xs text-fg-2">
                    {item.completed_at ? formatDateTime(item.completed_at) : ""}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
