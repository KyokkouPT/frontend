"use client";

import { useState } from "react";
import type { TopResponse } from "@kyokkou/contracts";
import { formatBytes, formatDuration, formatNumber, formatRatio } from "@/lib/format";
import { cn } from "@/lib/cn";
import { EmptyState } from "./ui/empty-state";
import { Panel } from "./ui/panel";

const TABS = [
  { key: "users-uploaded", label: "用户 · 上传量" },
  { key: "users-bonus", label: "用户 · 魔力值" },
  { key: "users-seedtime", label: "用户 · 做种时长" },
  { key: "torrents-seeders", label: "种子 · 做种" },
  { key: "torrents-completed", label: "种子 · 完成" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function TopBoards({ data }: { data: TopResponse }) {
  const [tab, setTab] = useState<TabKey>("users-uploaded");
  const isUsers = tab.startsWith("users-");

  const users =
    tab === "users-uploaded"
      ? data.users.uploaded
      : tab === "users-bonus"
        ? data.users.bonus
        : data.users.seedtime;
  const torrents = tab === "torrents-seeders" ? data.torrents.seeders : data.torrents.completed;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-1.5">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            aria-pressed={tab === item.key}
            className={cn(
              "h-9 rounded-sm border px-3 text-sm transition-colors",
              tab === item.key
                ? "border-accent bg-accent/12 font-semibold text-accent"
                : "border-line bg-surface-1 text-fg-1 hover:border-line-strong hover:text-fg-0",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <Panel flush>
        {isUsers ? (
          users.length === 0 ? (
            <EmptyState title="暂无排行数据" description="有活跃用户后会出现榜单。" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs text-fg-2">
                    <th className="px-4 py-2.5 font-medium">排名</th>
                    <th className="px-3 py-2.5 font-medium">用户</th>
                    <th className="px-3 py-2.5 font-medium">上传</th>
                    <th className="px-3 py-2.5 font-medium">下载</th>
                    <th className="px-3 py-2.5 font-medium">分享率</th>
                    <th className="px-3 py-2.5 font-medium">魔力值</th>
                    <th className="px-4 py-2.5 font-medium">做种时长</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((row) => (
                    <tr key={`${tab}-${row.username}`} className="border-b border-line/60 last:border-0">
                      <td className="px-4 py-2.5 font-mono text-xs text-fg-2">#{row.rank}</td>
                      <td className="px-3 py-2.5 font-medium">{row.username}</td>
                      <td className="px-3 py-2.5 font-mono text-xs">{formatBytes(row.uploaded)}</td>
                      <td className="px-3 py-2.5 font-mono text-xs">{formatBytes(row.downloaded)}</td>
                      <td className="px-3 py-2.5 font-mono text-xs">{formatRatio(row.ratio)}</td>
                      <td className="px-3 py-2.5 font-mono text-xs">{formatNumber(row.bonus)}</td>
                      <td className="px-4 py-2.5 font-mono text-xs">{formatDuration(row.seedtime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : torrents.length === 0 ? (
          <EmptyState title="暂无排行数据" description="有已通过的种子后会出现榜单。" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs text-fg-2">
                  <th className="px-4 py-2.5 font-medium">排名</th>
                  <th className="px-3 py-2.5 font-medium">种子</th>
                  <th className="px-3 py-2.5 font-medium">分类</th>
                  <th className="px-3 py-2.5 font-medium">做种</th>
                  <th className="px-3 py-2.5 font-medium">完成</th>
                  <th className="px-4 py-2.5 font-medium">大小</th>
                </tr>
              </thead>
              <tbody>
                {torrents.map((row) => (
                  <tr key={`${tab}-${String(row.id)}`} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-2.5 font-mono text-xs text-fg-2">#{row.rank}</td>
                    <td className="max-w-[420px] truncate px-3 py-2.5">
                      <a href={`/t/${String(row.id)}`} className="hover:text-accent">
                        {row.name}
                      </a>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-fg-2">{row.category}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">{formatNumber(row.seeders)}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">{formatNumber(row.completed)}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{formatBytes(row.size)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
