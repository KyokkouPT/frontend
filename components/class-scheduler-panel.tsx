"use client";

import { useCallback, useEffect, useState } from "react";
import type { ClassRunsResponse } from "@kyokkou/contracts";
import { ApiClientError, apiFetch, apiPost } from "@/lib/api/client";
import { Button } from "./ui/button";
import { Field, Input } from "./ui/field";
import { Notice } from "./notice";
import { Panel } from "./ui/panel";

export function ClassSchedulerPanel({
  initial,
}: {
  initial: { recalc_enabled: boolean; recalc_cron: string; next_run_at?: number | null };
}) {
  const [enabled, setEnabled] = useState(initial.recalc_enabled);
  const [cron, setCron] = useState(initial.recalc_cron);
  const [nextRun, setNextRun] = useState<number | null>(initial.next_run_at ?? null);
  const [pending, setPending] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [runs, setRuns] = useState<ClassRunsResponse["items"]>([]);

  const loadRuns = useCallback(async () => {
    try {
      const data = await apiFetch<ClassRunsResponse>("/api/v1/staff/classes/runs");
      setRuns(data.items);
    } catch {
      // 运行历史加载失败不阻塞设置
    }
  }, []);

  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  async function save(): Promise<void> {
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const response = await apiFetch<{
        settings: { recalc_enabled: boolean; recalc_cron: string; next_run_at?: number | null };
      }>("/api/v1/staff/classes/scheduler", {
        method: "PUT",
        body: JSON.stringify({ recalc_enabled: enabled, recalc_cron: cron.trim() }),
      });
      setNextRun(response.settings.next_run_at ?? null);
      setMessage("调度已保存");
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "保存失败");
    } finally {
      setPending(false);
    }
  }

  async function runNow(): Promise<void> {
    setRunning(true);
    setError(null);
    setMessage(null);
    try {
      const result = await apiPost<{ scanned: number; promoted: number; demoted: number }>(
        "/api/v1/staff/classes/recalc",
        {},
      );
      setMessage(`已运行：扫描 ${String(result.scanned)}，升级 ${String(result.promoted)}，降级 ${String(result.demoted)}`);
      await loadRuns();
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "运行失败");
    } finally {
      setRunning(false);
    }
  }

  return (
    <Panel title="等级重算调度" description="cron 使用后端主机时区，最小间隔 5 分钟；修改后立即热重载">
      {error && <Notice tone="warn">{error}</Notice>}
      {message && <Notice tone="info">{message}</Notice>}

      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="cron 表达式" htmlFor="recalc-cron" hint="默认 */15 * * * *">
            <Input id="recalc-cron" value={cron} onChange={(event) => setCron(event.target.value)} />
          </Field>
          <div className="flex items-end gap-2 pb-1">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
              启用自动重算
            </label>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="primary" disabled={pending} onClick={() => void save()}>
            {pending ? "保存中…" : "保存调度"}
          </Button>
          <Button type="button" variant="default" disabled={running} onClick={() => void runNow()}>
            {running ? "运行中…" : "立即运行"}
          </Button>
        </div>
      </div>

      <p className="mt-2 text-xs text-fg-2">
        下次运行：{nextRun ? new Date(nextRun).toLocaleString("zh-CN") : enabled ? "—" : "已停用"}
      </p>

      {runs.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead>
              <tr className="border-b border-line text-fg-2">
                <th className="py-2 pr-3 font-medium">开始</th>
                <th className="py-2 pr-3 font-medium">触发</th>
                <th className="py-2 pr-3 font-medium">扫描</th>
                <th className="py-2 pr-3 font-medium">升级</th>
                <th className="py-2 pr-3 font-medium">降级</th>
                <th className="py-2 font-medium">错误</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id} className="border-b border-line/60 last:border-0">
                  <td className="py-2 pr-3">{new Date(run.started_at).toLocaleString("zh-CN")}</td>
                  <td className="py-2 pr-3">{run.triggered_by === "cron" ? "定时" : "手动"}</td>
                  <td className="py-2 pr-3 font-mono">{run.scanned}</td>
                  <td className="py-2 pr-3 font-mono">{run.promoted}</td>
                  <td className="py-2 pr-3 font-mono">{run.demoted}</td>
                  <td className="py-2 text-danger">{run.error ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
