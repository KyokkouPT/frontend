import { redirect } from "next/navigation";
import type { RssResponse } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { PageHeader } from "@/components/page-header";
import { Notice } from "@/components/notice";
import { RssCopy } from "@/components/rss-copy";
import { Panel } from "@/components/ui/panel";

export const dynamic = "force-dynamic";

export const metadata = { title: "RSS" };

export default async function RssPage() {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect("/login?next=/me/rss");

  let rss: RssResponse;
  try {
    rss = await serverFetch<RssResponse>("/api/v1/me/rss");
  } catch (error) {
    const message =
      error instanceof ServerFetchError
        ? `后端返回 ${String(error.status)}：${error.message}`
        : error instanceof Error
          ? error.message
          : "无法连接后端";
    return (
      <Panel title="RSS 地址加载失败">
        <Notice tone="warn">{message}</Notice>
      </Panel>
    );
  }

  return (
    <>
      <PageHeader
        title="RSS 订阅"
        description="把地址加入阅读器，即可按筛选条件获取最新种子。"
      />

      <Panel title="个人 RSS 地址" description="地址包含个人 passkey，请勿公开分享">
        <div className="flex flex-wrap items-center gap-2">
          <code className="min-w-0 flex-1 rounded-sm bg-surface-2 px-2.5 py-2 text-xs leading-relaxed break-all">
            {rss.url}
          </code>
          <RssCopy url={rss.url} />
        </div>

        <ul className="mt-4 grid gap-1.5 text-xs leading-relaxed text-fg-2">
          <li>· 可与浏览页使用相同筛选参数：section / cat / promo / q / sort / limit / field.*。</li>
          <li>· enclosure 使用短期签名的 downhash 下载，XML 中不会出现裸 passkey。</li>
          <li>· 响应为 RSS 2.0，带 private, no-store，避免被中间缓存。</li>
        </ul>
      </Panel>
    </>
  );
}
