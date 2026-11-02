import { redirect } from "next/navigation";
import type { ClassesResponse, StaffAssessmentListResponse } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { PageHeader } from "@/components/page-header";
import { Notice } from "@/components/notice";
import { StaffAssessmentEditor } from "@/components/staff-assessment-editor";
import { Panel } from "@/components/ui/panel";

export const dynamic = "force-dynamic";

export const metadata = { title: "考核 / 任务管理" };

export default async function StaffAssessmentsPage() {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect("/login?next=/staff/assessments");
  if (!bootstrap.permissions.includes("staff.classes")) {
    return (
      <Panel title="无权访问">
        <Notice tone="warn">当前账号没有考核/任务管理权限。</Notice>
      </Panel>
    );
  }

  let assessments: StaffAssessmentListResponse;
  let classes: ClassesResponse;
  try {
    [assessments, classes] = await Promise.all([
      serverFetch<StaffAssessmentListResponse>("/api/v1/staff/assessments"),
      serverFetch<ClassesResponse>("/api/v1/staff/classes"),
    ]);
  } catch (error) {
    const message =
      error instanceof ServerFetchError
        ? `后端返回 ${String(error.status)}：${error.message}`
        : error instanceof Error
          ? error.message
          : "无法连接后端";
    return (
      <Panel title="加载失败">
        <Notice tone="warn">{message}</Notice>
      </Panel>
    );
  }

  return (
    <>
      <PageHeader
        title="考核 / 任务管理"
        description="创建任务或考核，按用户组/ID 手动分配；进度每 10 分钟更新，结算每 5 分钟运行。"
      />
      <StaffAssessmentEditor
        initial={assessments.items}
        classes={classes.items.map((item) => ({ slug: item.slug, name: item.name, rank: item.rank }))}
      />
    </>
  );
}
