import { notFound } from "next/navigation";
import type { UserProfile } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { formatBytes, formatDate, formatDuration, formatNumber, formatRatio } from "@/lib/format";
import { Breadcrumbs, PageHeader } from "@/components/page-header";
import { Notice } from "@/components/notice";
import { TorrentRow } from "@/components/torrent-row";
import { Panel } from "@/components/ui/panel";
import { StatCard } from "@/components/ui/stat";

export const dynamic = "force-dynamic";

const ROLE_LABEL = { user: "用户", moderator: "版主", admin: "管理员" } as const;

export default async function UserPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  const bootstrap = await getBootstrap();
  const me = bootstrap?.me ?? null;

  let profile: UserProfile;
  try {
    profile = await serverFetch<UserProfile>(`/api/v1/users/${encodeURIComponent(decoded)}`);
  } catch (error) {
    if (error instanceof ServerFetchError && error.status === 404) notFound();
    const message =
      error instanceof ServerFetchError
        ? `后端返回 ${String(error.status)}：${error.message}`
        : error instanceof Error
          ? error.message
          : "无法连接后端";
    return (
      <Panel title="用户资料加载失败">
        <Notice tone="warn">{message}</Notice>
      </Panel>
    );
  }

  return (
    <>
      <Breadcrumbs
        items={[{ label: "首页", href: "/" }, { label: "用户" }, { label: profile.name }]}
      />

      <PageHeader
        title={profile.name}
        description={`${ROLE_LABEL[profile.role]} · ${profile.class_key} · 加入于 ${formatDate(profile.joined_at)}`}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="上传" value={formatBytes(profile.uploaded)} />
        <StatCard label="下载" value={formatBytes(profile.downloaded)} />
        <StatCard label="分享率" value={formatRatio(profile.ratio)} tone="accent" />
        <StatCard label="做种时长" value={formatDuration(profile.seedtime)} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-3">
        <StatCard label="发布" value={formatNumber(profile.published_count)} />
        <StatCard
          label="做种"
          value={profile.seeding_count === null ? "未公开" : formatNumber(profile.seeding_count)}
        />
      </div>

      <Panel
        title="最近发布"
        description={profile.published_visible ? "已通过审核的种子" : "该用户未公开发布列表"}
      >
        {profile.published_visible ? (
          profile.published.length === 0 ? (
            <p className="text-sm text-fg-2">暂无已发布的种子。</p>
          ) : (
            <div className="grid gap-2">
              {profile.published.map((torrent) => (
                <TorrentRow key={torrent.id} torrent={torrent} canDownload={Boolean(me)} />
              ))}
            </div>
          )
        ) : (
          <p className="text-sm text-fg-2">该用户关闭了公开的发布列表。</p>
        )}
      </Panel>
    </>
  );
}
