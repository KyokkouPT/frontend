"use client";

import { useState } from "react";
import Link from "next/link";
import type { ClassSimulationResponse, ClassSimulationSearchResponse } from "@kyokkou/contracts";
import { ApiClientError, apiFetch } from "@/lib/api/client";
import { formatBonus, formatBytes, formatRatio } from "@/lib/format";
import { Button } from "./ui/button";
import { Field, Input } from "./ui/field";
import { Notice } from "./notice";
import { Panel } from "./ui/panel";
import { Badge } from "./ui/badge";

const ACTION_LABEL: Record<ClassSimulationResponse["action"], string> = {
  promote: "升级",
  demote: "降级",
  keep: "保持",
};

const ACTION_TONE: Record<ClassSimulationResponse["action"], "ok" | "danger" | "muted"> = {
  promote: "ok",
  demote: "danger",
  keep: "muted",
};

export function ClassSimulator() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ClassSimulationSearchResponse["items"]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<ClassSimulationSearchResponse["items"][number] | null>(null);
  const [simulation, setSimulation] = useState<ClassSimulationResponse | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search(): Promise<void> {
    setSearching(true);
    setError(null);
    setSimulation(null);
    try {
      const data = await apiFetch<ClassSimulationSearchResponse>(
        `/api/v1/staff/classes/simulate/search?q=${encodeURIComponent(query.trim())}`,
      );
      setResults(data.items);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "搜索失败");
    } finally {
      setSearching(false);
    }
  }

  async function simulate(user: ClassSimulationSearchResponse["items"][number]): Promise<void> {
    setSelected(user);
    setPending(true);
    setError(null);
    try {
      const data = await apiFetch<ClassSimulationResponse>("/api/v1/staff/classes/simulate", {
        method: "POST",
        body: JSON.stringify({ user_id: user.id }),
      });
      setSimulation(data);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "模拟失败");
      setSimulation(null);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6">
      <Panel title="选择用户" description="按用户名搜索；模拟只读，不会修改任何数据">
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void search();
          }}
        >
          <Field label="用户名" htmlFor="sim-q" className="min-w-[220px] flex-1">
            <Input
              id="sim-q"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="输入用户名，留空显示最近用户"
            />
          </Field>
          <Button type="submit" variant="primary" disabled={searching}>
            {searching ? "搜索中…" : "搜索"}
          </Button>
        </form>

        {results.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {results.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => void simulate(user)}
                disabled={pending}
                className={`flex items-center gap-2 rounded-sm border px-2.5 py-1.5 text-xs transition-colors ${
                  selected?.id === user.id
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-line bg-surface-2 text-fg-1 hover:border-line-strong hover:text-fg-0"
                }`}
              >
                <b className="font-medium">{user.username}</b>
                <span className="text-fg-2">{user.class.name}</span>
              </button>
            ))}
          </div>
        )}
      </Panel>

      {error && <Notice tone="warn">{error}</Notice>}

      {simulation && (
        <Panel
          title={`${simulation.username} · 下次重算结果`}
          description={`当前等级：${simulation.current.name}（rank ${String(simulation.current.rank)}）`}
        >
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="default">{simulation.current.name}</Badge>
              <span className="text-fg-2">→</span>
              <Badge tone={ACTION_TONE[simulation.action]}>
                {ACTION_LABEL[simulation.action]}
                {simulation.target ? `：${simulation.target.name}` : ""}
              </Badge>
              {simulation.target && (
                <span className="font-mono text-2xs text-fg-2">rank {simulation.target.rank}</span>
              )}
              <Link href={`/staff/users/${String(simulation.user_id)}`} className="ml-auto text-xs text-accent hover:underline">
                查看用户
              </Link>
            </div>

            {simulation.path.length > 0 && (
              <p className="text-sm text-fg-1">
                升级路径：{simulation.path.map((step) => step.name).join(" → ")}
              </p>
            )}

            {simulation.missing.length > 0 && (
              <div>
                <p className="mb-1 text-sm font-medium text-fg-1">缺失条件</p>
                <ul className="grid gap-1 text-xs text-fg-2">
                  {simulation.missing.map((item) => (
                    <li key={item}>· {item}</li>
                  ))}
                </ul>
              </div>
            )}

            {simulation.demote_reason && (
              <p className="text-sm text-danger">降级判定：{simulation.demote_reason}</p>
            )}
            {simulation.blocked_reason && <Notice tone="info">{simulation.blocked_reason}</Notice>}
            {simulation.locked_until && (
              <p className="text-xs text-warn">
                等级锁定至：{new Date(simulation.locked_until).toLocaleString("zh-CN")}
              </p>
            )}
            {simulation.demote_due_at && (
              <p className="text-xs text-warn">
                降级缓冲到期：{new Date(simulation.demote_due_at).toLocaleString("zh-CN")}
              </p>
            )}

            <div className="grid gap-2 rounded-sm border border-line bg-surface-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
              <Metric label="注册天数" value={`${String(simulation.metrics.age_days)} 天`} />
              <Metric label="上传量" value={formatBytes(simulation.metrics.uploaded)} />
              <Metric label="实际上传量" value={formatBytes(simulation.metrics.raw_uploaded)} />
              <Metric label="下载量" value={formatBytes(simulation.metrics.downloaded)} />
              <Metric label="实际下载量" value={formatBytes(simulation.metrics.raw_downloaded)} />
              <Metric label="分享率" value={formatRatio(simulation.metrics.ratio)} />
              <Metric label="做种时长" value={`${simulation.metrics.seedtime_hours.toFixed(1)} 小时`} />
              <Metric label="魔力/做种积分" value={formatBonus(simulation.metrics.bonus)} />
              <Metric label="发布数" value={String(simulation.metrics.torrents_published)} />
              <Metric label="已用邀请" value={String(simulation.metrics.invites_used)} />
              <Metric label="警告次数" value={String(simulation.metrics.warnings)} />
              <Metric label="未完成 H&R" value={String(simulation.metrics.hnr_unfinished)} />
              <Metric
                label="最近活跃"
                value={simulation.metrics.last_active_days >= 9999 ? "未知" : `${String(simulation.metrics.last_active_days)} 天前`}
              />
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 text-xs">
      <span className="text-fg-2">{label}</span>
      <span className="font-mono text-fg-1">{value}</span>
    </div>
  );
}
