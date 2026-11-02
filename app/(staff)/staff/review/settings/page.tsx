import Link from "next/link";
import { redirect } from "next/navigation";
import type { StaffReviewSettingsResponse } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { Breadcrumbs, PageHeader } from "@/components/page-header";
import { Notice } from "@/components/notice";
import { ReviewSettingsEditor } from "@/components/review-settings-editor";
import { Panel } from "@/components/ui/panel";

export const dynamic = "force-dynamic";

export const metadata = { title: "审核设置" };

export default async function StaffReviewSettingsPage() {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect("/login?next=/staff/review/settings");
  if (!bootstrap.permissions.includes("staff.review")) {
    return (
      <Panel title="无权访问">
        <Notice tone="warn">当前账号没有审核权限。</Notice>
      </Panel>
    );
  }

  let data: StaffReviewSettingsResponse;
  try {
    data = await serverFetch<StaffReviewSettingsResponse>("/api/v1/staff/review/settings");
  } catch (error) {
    const message =
      error instanceof ServerFetchError
        ? `后端返回 ${String(error.status)}：${error.message}`
        : error instanceof Error
          ? error.message
          : "无法连接后端";
    return (
      <Panel title="审核设置加载失败">
        <Notice tone="warn">{message}</Notice>
      </Panel>
    );
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "站务", href: "/staff" },
          { label: "审核台", href: "/staff/review" },
          { label: "审核设置" },
        ]}
      />
      <PageHeader
        title="审核设置"
        description="信任用户自动通过、信任门槛与待审提醒。"
        actions={
          <Link href="/staff/review" className="text-sm text-accent hover:underline">
            返回审核台
          </Link>
        }
      />
      <ReviewSettingsEditor initial={data.settings} />
    </>
  );
}
