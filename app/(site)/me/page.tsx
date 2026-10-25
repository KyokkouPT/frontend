import { redirect } from "next/navigation";
import { Timer } from "lucide-react";
import type { MeResponse } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { formatBytes, formatDate, formatDuration, formatNumber, formatRatio } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Notice } from "@/components/notice";
import { RatioRing } from "@/components/ratio-ring";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/panel";
import { StatCard } from "@/components/ui/stat";

export const dynamic = "force-dynamic";

export const metadata = { title: "我的" };

const ROLE_LABEL = { user: "用户", moderator: "版主", admin: "管理员" } as const;

export default async function MePage({
  searchParams,
}: {
  searchParams: Promise<{ uploaded?: string | string[] }>;
}) {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect("/login?next=/me");

  const params = await searchParams;
  const uploadedRaw = Array.isArray(params.uploaded) ? params.uploaded[0] : params.uploaded;
  const uploaded = uploadedRaw === "approved" || uploadedRaw === "pending" ? uploadedRaw : null;

  let me: MeResponse;
  try {
    me = await serverFetch<MeResponse>("/api/v1/me");
  } catch (error) {
    if (error instanceof ServerFetchError && error.status === 401) {
      redirect("/login?next=/me");
    }
    const message =
      error instanceof ServerFetchError
        ? `后端返回 ${String(error.status)}：${error.message}`
        : error instanceof Error
          ? error.message
          : "无法连接后端";
    return (
      <Panel title="个人数据加载失败">
        <Notice tone="warn">{message}</Notice>
      </Panel>
    );
  }

  const user = me.user;
  const ratioArc = user.ratio === null ? 1 : Math.min(user.ratio, 2) / 2;

  return (
    <>
      <PageHeader
        title="我的概览"
        count={`#${String(user.id)}`}
        description={`加入于 ${formatDate(user.created_at)} · ${user.username}`}
      />

      {uploaded && (
        <Notice tone="info" className="mb-4">
          {uploaded === "approved"
            ? "种子已通过审核并公开，可以在浏览页看到它。"
            : "种子已提交，正在等待审核；结果会通过站内通知发送。"}
        </Notice>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
        <Panel title="身份">
          <div className="flex items-center gap-4">
            <RatioRing value={formatRatio(user.ratio)} ratio={ratioArc} />
            <div className="min-w-0">
              <b className="block truncate text-base font-semibold">{user.username}</b>
              <p className="mt-0.5 text-xs text-fg-2">
                {ROLE_LABEL[user.role]} · {user.class_key}
              </p>
              <Badge tone={user.status === "active" ? "ok" : "danger"} className="mt-2">
                {user.status === "active" ? "正常" : user.status}
              </Badge>
            </div>
          </div>

          <dl className="mt-4 grid gap-2.5 text-sm">
            <Row label="上传量" value={formatBytes(user.uploaded)} />
            <Row label="下载量" value={formatBytes(user.downloaded)} />
            <Row label="分享率" value={formatRatio(user.ratio)} />
            <Row label="做种时长" value={formatDuration(user.seedtime)} />
            <Row label="魔力值" value={formatNumber(user.bonus)} />
          </dl>
        </Panel>

        <div className="grid min-w-0 gap-6">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatCard label="发布" value={formatNumber(me.stats.published)} sub="已通过审核" />
            <StatCard label="做种" value={formatNumber(me.stats.seeding)} sub="个种子" />
            <StatCard label="下载中" value={formatNumber(me.stats.leeching)} sub="个种子" />
            <StatCard label="魔力值" value={formatNumber(user.bonus)} sub="当前余额" tone="accent" />
          </div>

          <Panel title="H&R 义务" description="下载量达到策略阈值后会生成保种义务">
            {me.hnr.length === 0 ? (
              <EmptyState
                icon={<Timer className="size-5" />}
                title="暂无 H&R 待办"
                description="当前没有需要补做种的义务；下载并完成结算后会出现在这里。"
              />
            ) : (
              <ul className="grid gap-2">
                {me.hnr.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="min-w-0 truncate">{item.name}</span>
                    <Badge tone={item.status === "unreached" ? "danger" : "warn"} className="ml-auto">
                      {item.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="最近下载" description="Tracker announce 数据接入后显示">
            {me.snatches.length === 0 ? (
              <EmptyState
                title="还没有下载记录"
                description="Tracker 纵切上线后，这里会显示做种/下载进度与保种时长。"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line text-xs text-fg-2">
                      <th className="py-2 pr-3 font-medium">种子</th>
                      <th className="px-3 py-2 font-medium">上传</th>
                      <th className="px-3 py-2 font-medium">下载</th>
                      <th className="px-3 py-2 font-medium">做种时长</th>
                    </tr>
                  </thead>
                  <tbody>
                    {me.snatches.map((snatch) => (
                      <tr key={snatch.torrent_id} className="border-b border-line/60 last:border-0">
                        <td className="max-w-[420px] truncate py-2.5 pr-3">{snatch.name}</td>
                        <td className="px-3 py-2.5 font-mono text-xs">
                          {formatBytes(snatch.uploaded)}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs">
                          {formatBytes(snatch.downloaded)}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs">
                          {formatDuration(snatch.seedtime)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
