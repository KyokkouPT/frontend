import { notFound } from "next/navigation";
import type { BtClientsResponse, UserProfile } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import {
  formatBonus,
  formatBytes,
  formatDate,
  formatDuration,
  formatNumber,
  formatRatio,
} from "@/lib/format";
import { Breadcrumbs, PageHeader } from "@/components/page-header";
import { BtClientsPanel } from "@/components/bt-clients-panel";
import { Notice } from "@/components/notice";
import { RatioRing } from "@/components/ratio-ring";
import { TorrentRow } from "@/components/torrent-row";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { StatCard } from "@/components/ui/stat";

export const dynamic = "force-dynamic";

export default async function UserByIdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = Number(id);
  if (!Number.isInteger(userId) || userId <= 0) notFound();

  const bootstrap = await getBootstrap();
  const me = bootstrap?.me ?? null;

  let profile: UserProfile;
  try {
    profile = await serverFetch<UserProfile>(`/api/v1/users/id/${String(userId)}`);
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

  let clients: BtClientsResponse;
  try {
    clients = await serverFetch<BtClientsResponse>(`/api/v1/users/${String(userId)}/clients`);
  } catch {
    clients = { items: [], hidden: false };
  }

  const ratioArc = profile.ratio === null ? 1 : Math.min(profile.ratio, 2) / 2;

  return (
    <>
      <Breadcrumbs
        items={[{ label: "首页", href: "/" }, { label: "用户" }, { label: profile.name }]}
      />

      <PageHeader
        title={profile.name}
        count={`#${String(userId)}`}
        description={`${profile.class.name} · rank ${String(profile.class.rank)} · 加入于 ${formatDate(profile.joined_at)}`}
      />

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
        <Panel title="身份">
          <div className="flex items-center gap-4">
            <RatioRing value={formatRatio(profile.ratio)} ratio={ratioArc} />
            <div className="min-w-0">
              <b className="block truncate text-base font-semibold">{profile.name}</b>
              {profile.custom_title && (
                <p className="truncate text-xs text-accent">{profile.custom_title}</p>
              )}
              <p className="mt-0.5 text-xs text-fg-2">
                {profile.class.name} · rank {String(profile.class.rank)}
              </p>
              <Badge tone="ok" className="mt-2">
                正常
              </Badge>
            </div>
          </div>

          <dl className="mt-4 grid gap-2.5 text-sm">
            <Row label="上传量" value={formatBytes(profile.uploaded)} />
            <Row label="实际上传量" value={formatBytes(profile.raw_uploaded)} />
            <Row label="下载量" value={formatBytes(profile.downloaded)} />
            <Row label="实际下载量" value={formatBytes(profile.raw_downloaded)} />
            <Row label="分享率" value={formatRatio(profile.ratio)} />
            <Row label="做种时长" value={formatDuration(profile.seedtime)} />
            <Row label="魔力值" value={formatBonus(profile.bonus)} />
          </dl>
        </Panel>

        <div className="grid min-w-0 gap-6">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
            <StatCard label="发布" value={formatNumber(profile.published_count)} sub="已通过审核" />
            <StatCard
              label="做种"
              value={profile.seeding_count === null ? "未公开" : formatNumber(profile.seeding_count)}
              sub="个种子"
            />
            <StatCard label="魔力值" value={formatBonus(profile.bonus)} sub="当前余额" tone="accent" />
          </div>

          <BtClientsPanel data={clients} />

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
