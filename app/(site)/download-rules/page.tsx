import { redirect } from "next/navigation";
import type { DownloadRulesResponse } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { serverFetch, ServerFetchError } from "@/lib/api/server";
import { DownloadRulesPanel } from "@/components/download-rules-panel";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";
export const metadata = { title: "下载规则确认" };
export default async function DownloadRulesPage() {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect("/login?next=/download-rules");
  try {
    const data = await serverFetch<DownloadRulesResponse>("/api/v1/download-rules");
    return <><PageHeader title="下载规则确认" description="在网页确认后，同一账号的 RSS 与签名下载也会放行。" /><DownloadRulesPanel initial={data} key={data.version} /></>;
  } catch (error) {
    return <Notice tone="warn">{error instanceof ServerFetchError ? error.message : "下载规则加载失败，请稍后重试"}</Notice>;
  }
}
