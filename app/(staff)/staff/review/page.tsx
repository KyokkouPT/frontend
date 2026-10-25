import { notFound, redirect } from "next/navigation";
import type { ReviewQueueResponse, ReviewReasonsResponse } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { PageHeader } from "@/components/page-header";
import { Notice } from "@/components/notice";
import { ReviewQueue } from "@/components/review-queue";
import { Panel } from "@/components/ui/panel";

export const dynamic = "force-dynamic";

export const metadata = { title: "审核台" };

export default async function StaffReviewPage() {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect("/login?next=/staff/review");
  if (!bootstrap.permissions.includes("staff.review")) notFound();

  let queue: ReviewQueueResponse;
  let reasons: ReviewReasonsResponse;
  try {
    [queue, reasons] = await Promise.all([
      serverFetch<ReviewQueueResponse>("/api/v1/staff/review"),
      serverFetch<ReviewReasonsResponse>("/api/v1/staff/review/reasons"),
    ]);
  } catch (error) {
    const message =
      error instanceof ServerFetchError
        ? `后端返回 ${String(error.status)}：${error.message}`
        : error instanceof Error
          ? error.message
          : "无法连接后端";
    return (
      <Panel title="审核队列加载失败">
        <Notice tone="warn">{message}</Notice>
      </Panel>
    );
  }

  return (
    <>
      <PageHeader
        title="审核台"
        count={`${String(queue.items.length)} 待审`}
        description="通过、驳回或退回；每个动作都会写审计并通知发布者。"
      />
      <ReviewQueue initial={queue.items} reasons={reasons.reasons} />
    </>
  );
}
