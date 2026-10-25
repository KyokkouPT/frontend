import Link from "next/link";
import {
  Activity,
  AppWindow,
  ArrowDown,
  ArrowUp,
  BookOpen,
  Film,
  Folder,
  Gamepad2,
  GraduationCap,
  Megaphone,
  Music,
  Sparkles,
  Timer,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { HomeResponse } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { formatBytes, formatDate, formatNumber, formatRatio, formatRelativeTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/panel";
import { StatCard } from "@/components/ui/stat";
import { TorrentRow } from "@/components/torrent-row";
import { PromoBadge } from "@/components/promo-badge";
import { Notice } from "@/components/notice";

export const dynamic = "force-dynamic";

const SECTION_ICON: Record<string, LucideIcon> = {
  movie: Film,
  game: Gamepad2,
  music: Music,
  ebook: BookOpen,
  learn: GraduationCap,
  software: AppWindow,
};

type HomeState = { data: HomeResponse } | { error: string };

async function loadHome(): Promise<HomeState> {
  try {
    return { data: await serverFetch<HomeResponse>("/api/v1/home") };
  } catch (error) {
    if (error instanceof ServerFetchError) {
      return { error: `后端返回 ${String(error.status)}：${error.message}` };
    }
    return { error: error instanceof Error ? error.message : "无法连接后端" };
  }
}

export default async function HomePage() {
  const [bootstrap, home] = await Promise.all([getBootstrap(), loadHome()]);
  const me = bootstrap?.me ?? null;
  const site = bootstrap?.site ?? null;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">
            {me ? `欢迎回来，${me.username}` : `欢迎来到 ${site?.name ?? "KyokkouPT"}`}
          </h1>
          <p className="mt-0.5 text-sm text-fg-1">
            {me ? (
              <>
                分享率 <b className="font-mono text-fg-0">{formatRatio(me.ratio)}</b> · 上传{" "}
                {formatBytes(me.uploaded)} · 下载 {formatBytes(me.downloaded)}
              </>
            ) : (
              (site?.tagline ?? "私有种子站引擎")
            )}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {me ? (
            <Link
              href="/me"
              className="inline-flex h-10 items-center gap-2 rounded-sm border border-line bg-surface-1 px-4 text-base font-medium text-fg-0 transition-colors hover:border-line-strong hover:bg-surface-2"
            >
              <Users className="size-4" />
              我的概览
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-10 items-center gap-2 rounded-sm border border-accent bg-accent px-4 text-base font-semibold text-accent-ink transition hover:brightness-110"
            >
              <Sparkles className="size-4" />
              登录站点
            </Link>
          )}
        </div>
      </div>

      {"error" in home ? (
        <Panel title="首页数据加载失败" description="浏览器与后端的连接或会话状态异常">
          <Notice tone="warn">{home.error}</Notice>
          <p className="mt-3 text-xs leading-relaxed text-fg-2">
            确认后端已启动：在 <code className="font-mono">backend/</code> 执行{" "}
            <code className="font-mono">pnpm dev</code>（http://127.0.0.1:31001），然后刷新页面。
          </p>
        </Panel>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatCard
              label="在线 peer"
              value={formatNumber(home.data.stats.peers)}
              sub={`做种 ${formatNumber(home.data.stats.seeders)}`}
              icon={<Activity className="size-3" />}
            />
            <StatCard
              label="种子总数"
              value={formatNumber(home.data.stats.torrents)}
              sub={`今日新增 ${formatNumber(home.data.stats.new_today)}`}
              tone="accent"
            />
            <StatCard
              label="用户"
              value={formatNumber(home.data.stats.users)}
              sub="活跃账号"
            />
            <StatCard
              label="下载中"
              value={formatNumber(home.data.stats.leechers)}
              sub="leechers"
              tone="warn"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div className="grid min-w-0 gap-6">
              <Panel
                title="最新发布"
                description="已通过审核的种子；详情与下载将在下一个纵切接入"
                right={<Badge tone="default" mono>{`${String(home.data.latest.length)} 条`}</Badge>}
              >
                {home.data.latest.length === 0 ? (
                  <EmptyState
                    icon={<Folder className="size-5" />}
                    title="还没有已通过的种子"
                    description="审核通过后，种子会出现在这里。"
                  />
                ) : (
                  <div className="grid gap-2">
                    {home.data.latest.map((torrent) => (
                      <TorrentRow key={torrent.id} torrent={torrent} canDownload={Boolean(me)} />
                    ))}
                  </div>
                )}
              </Panel>

              <Panel title="公告" description="站点运营公告与规则变更">
                {home.data.announcements.length === 0 ? (
                  <EmptyState
                    icon={<Megaphone className="size-5" />}
                    title="暂无公告"
                    description="管理员发布公告后会显示在这里。"
                  />
                ) : (
                  <ul className="grid gap-4">
                    {home.data.announcements.map((item) => (
                      <li key={item.id} className="grid gap-1 border-b border-line/60 pb-4 last:border-0 last:pb-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {item.pinned && <Badge tone={item.tone === "warn" ? "warn" : "accent"}>置顶</Badge>}
                          <b className="text-sm font-semibold">{item.title}</b>
                          <span className="ml-auto shrink-0 text-2xs text-fg-2">
                            {item.author ?? "管理员"} · {formatRelativeTime(item.created_at)}
                          </span>
                        </div>
                        <p className="line-clamp-2 text-xs leading-relaxed text-fg-1">{item.body}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>

            <div className="grid min-w-0 gap-6">
              <Panel title="分区" description="由站点配置驱动">
                <ul className="grid gap-1.5">
                  {(bootstrap?.sections ?? []).map((section) => {
                    const Icon = SECTION_ICON[section.slug] ?? Folder;
                    return (
                      <li
                        key={section.slug}
                        className="flex items-center gap-2.5 rounded-sm px-1.5 py-1.5 text-sm"
                      >
                        <Icon className="size-4 shrink-0 text-fg-2" />
                        <span className="truncate font-medium">{section.name}</span>
                        <span className="ml-auto shrink-0 font-mono text-2xs text-fg-2">
                          {section.categories.length} 类 · {section.fields.length} 字段
                        </span>
                      </li>
                    );
                  })}
                  {(bootstrap?.sections.length ?? 0) === 0 && (
                    <li className="text-xs text-fg-2">分区尚未配置。</li>
                  )}
                </ul>
              </Panel>

              <Panel title="进行中的促销" description="免费与倍率活动">
                {home.data.promos.length === 0 ? (
                  <p className="text-xs text-fg-2">当前没有进行中的促销活动。</p>
                ) : (
                  <ul className="grid gap-2.5">
                    {home.data.promos.map((promo) => (
                      <li key={promo.id} className="grid gap-1">
                        <div className="flex items-center gap-2">
                          <PromoBadge promo={normalizePromo(promo.promo)} />
                          <b className="min-w-0 truncate text-[13px] font-medium">{promo.name}</b>
                        </div>
                        <p className="text-2xs text-fg-2">{promo.scope}</p>
                        <p className="text-2xs text-fg-2">
                          {promo.ends_at
                            ? `截止 ${formatDate(promo.ends_at)}`
                            : "长期有效"}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              {me && (
                <Panel title="我的待办">
                  <div className="grid gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Timer className="size-4 text-fg-2" />
                      <span className="text-fg-1">H&R 待办</span>
                      <Badge tone={home.data.my && home.data.my.hnr_due > 0 ? "warn" : "default"} className="ml-auto">
                        {home.data.my?.hnr_due ?? 0}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <ArrowUp className="size-4 text-ok" />
                      <span className="text-fg-1">上传量</span>
                      <span className="ml-auto font-mono text-xs">{formatBytes(me.uploaded)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <ArrowDown className="size-4 text-accent-2" />
                      <span className="text-fg-1">下载量</span>
                      <span className="ml-auto font-mono text-xs">{formatBytes(me.downloaded)}</span>
                    </div>
                  </div>
                </Panel>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

function normalizePromo(value: string): "free" | "2x" | "50" | "30" | "none" {
  return value === "free" || value === "2x" || value === "50" || value === "30" ? value : "none";
}
