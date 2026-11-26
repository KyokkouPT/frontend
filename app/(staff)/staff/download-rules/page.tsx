import { redirect } from "next/navigation";
import type { StaffDownloadRulesResponse } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { serverFetch, ServerFetchError } from "@/lib/api/server";
import { StaffDownloadRules } from "@/components/staff-download-rules";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";
export const metadata = { title: "下载规则管理" };
export default async function StaffDownloadRulesPage() {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect("/login?next=/staff/download-rules");
  if (!bootstrap.permissions.includes("staff.settings")) return <Notice tone="warn">没有站点设置权限。</Notice>;
  try {
    const data = await serverFetch<StaffDownloadRulesResponse>("/api/v1/staff/download-rules");
    return <><PageHeader title="下载规则管理" description="维护草稿、明确发布并记录账号确认版本；操作写入审计日志。" /><StaffDownloadRules initial={data} /></>;
  } catch (error) {
    return <Notice tone="warn">{error instanceof ServerFetchError ? error.message : "下载规则加载失败，请稍后重试"}</Notice>;
  }
}
