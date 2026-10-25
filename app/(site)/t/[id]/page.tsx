import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, LogIn } from "lucide-react";
import type { TorrentDetail } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { formatBytes, formatDate, formatNumber, formatRelativeTime } from "@/lib/format";
import { Breadcrumbs, PageHeader } from "@/components/page-header";
import { Notice } from "@/components/notice";
import { PromoBadge } from "@/components/promo-badge";
import { TorrentRow } from "@/components/torrent-row";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";

export const dynamic = "force-dynamic";

export default async function TorrentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bootstrap = await getBootstrap();
  const me = bootstrap?.me ?? null;

  let detail: TorrentDetail;
  try {
    detail = await serverFetch<TorrentDetail>(`/api/v1/torrents/${encodeURIComponent(id)}`);
  } catch (error) {
    if (error instanceof ServerFetchError && error.status === 404) notFound();
    const message =
      error instanceof ServerFetchError
        ? `后端返回 ${String(error.status)}：${error.message}`
        : error instanceof Error
          ? error.message
          : "无法连接后端";
    return (
      <Panel title="种子加载失败">
        <Notice tone="warn">{message}</Notice>
      </Panel>
    );
  }

  const downloadHref = me ? detail.download_url : `/login?next=${encodeURIComponent(`/t/${id}`)}`;
  const metaEntries = Object.entries(detail.meta);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "首页", href: "/" },
          { label: "浏览", href: "/browse" },
          { label: detail.name },
        ]}
      />

      <PageHeader
        title={
          <>
            <PromoBadge promo={detail.promo} className="mr-3" />
            {detail.name}
          </>
        }
        description={`${detail.section.name} · ${detail.category.name} · ${formatBytes(detail.size)}`}
        actions={
          <a
            href={downloadHref}
            className="inline-flex h-10 items-center gap-2 rounded-sm border border-accent bg-accent px-4 text-base font-semibold text-accent-ink transition hover:brightness-110"
          >
            {me ? <Download className="size-4" /> : <LogIn className="size-4" />}
            {me ? "下载种子" : "登录后下载"}
          </a>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="grid min-w-0 gap-6">
          <Panel title="描述">
            {detail.description ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{detail.description}</p>
            ) : (
              <p className="text-sm text-fg-2">发布者没有填写描述。</p>
            )}
          </Panel>

          <Panel title={`文件（${String(detail.files.length)}）`} description="来自 .torrent 的文件树" flush>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs text-fg-2">
                    <th className="px-4 py-2 font-medium">路径</th>
                    <th className="px-4 py-2 text-right font-medium">大小</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.files.map((file) => (
                    <tr key={file.path} className="border-b border-line/60 last:border-0">
                      <td className="max-w-[560px] truncate px-4 py-2 font-mono text-xs">{file.path}</td>
                      <td className="px-4 py-2 text-right font-mono text-xs">{formatBytes(file.size)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          {detail.related.length > 0 && (
            <Panel title="同分区其他版本" description="按发布时间排序">
              <div className="grid gap-2">
                {detail.related.map((torrent) => (
                  <TorrentRow key={torrent.id} torrent={torrent} canDownload={Boolean(me)} />
                ))}
              </div>
            </Panel>
          )}
        </div>

        <div className="grid min-w-0 gap-6">
          <Panel title="规格">
            <dl className="grid gap-2.5 text-sm">
              <Row label="大小" value={formatBytes(detail.size)} />
              <Row label="文件数" value={formatNumber(detail.files_count)} />
              <Row label="做种" value={formatNumber(detail.seeders)} />
              <Row label="下载" value={formatNumber(detail.leechers)} />
              <Row label="完成" value={formatNumber(detail.completed)} />
              <Row label="发布者" value={detail.uploader?.name ?? "未知"} />
              <Row label="发布时间" value={`${formatDate(detail.created_at)} · ${formatRelativeTime(detail.created_at)}`} />
            </dl>

            {metaEntries.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">
                {metaEntries.map(([key, value]) => (
                  <Badge key={key} tone="default">
                    {key}: {String(value)}
                  </Badge>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="标签">
            {detail.tags.length === 0 ? (
              <p className="text-sm text-fg-2">没有标签。</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {detail.tags.map((tag) => (
                  <Badge key={tag} tone="accent">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Info hash" description="Tracker 使用原始 20 字节 info 计算">
            <code className="block text-xs leading-relaxed break-all text-fg-1">{detail.info_hash}</code>
            <p className="mt-2 text-2xs leading-relaxed text-fg-2">
              下载 .torrent 时只替换 announce 并注入当前账号 passkey，info 原始字节保持不变。
            </p>
          </Panel>

          <Link href="/browse" className="text-sm text-accent hover:underline">
            ← 返回浏览
          </Link>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-3 border-b border-line/60 pb-2.5 last:border-0">
      <dt className="text-xs text-fg-2">{label}</dt>
      <dd className="ml-auto font-mono text-[13px]">{value}</dd>
    </div>
  );
}
