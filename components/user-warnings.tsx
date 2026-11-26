"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { UserWarningsResponse, SettleWarningsResponse } from "@kyokkou/contracts";
import { ApiClientError, apiFetch, apiPost } from "@/lib/api/client";
import { Button } from "./ui/button";
import { Field, Input, Textarea } from "./ui/field";
import { Panel } from "./ui/panel";
import { Notice } from "./notice";

function timestamp(value: number) { return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(value); }
export function UserWarnings({ userId, initial, canIssue, canSettle }: { userId: number; initial: UserWarningsResponse; canIssue: boolean; canSettle: boolean }) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [reason, setReason] = useState("");
  const [days, setDays] = useState("0");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => { setData(initial); }, [initial]);
  const path = `/api/v1/staff/users/${String(userId)}/warnings`;
  async function reload(before?: number) {
    const next = await apiFetch<UserWarningsResponse>(`${path}${before ? `?before=${String(before)}` : ""}`);
    setData((previous) => ({ ...next, items: before ? [...previous.items, ...next.items] : next.items }));
  }
  async function run(action: () => Promise<void>, refresh = false) {
    setBusy(true); setError(null); setMessage(null);
    try { await action(); if (refresh) router.refresh(); }
    catch (caught) { setError(caught instanceof ApiClientError ? caught.fields?.[0]?.message ?? caught.message : "警告记录操作失败，请重试"); }
    finally { setBusy(false); }
  }
  return <Panel title="逐条警告与到期" description="新警告可设置期限；到期任务约每五分钟结算一次。旧有警告保留为永久次数，不会被自动清除。">
    {error && <Notice tone="warn">{error}</Notice>}{message && <Notice tone="info">{message}</Notice>}
    <p className="mb-3 text-sm" role="status">当前警告次数：{data.total_warnings}</p>
    {canIssue && <form className="mb-4 grid gap-3" onSubmit={(event) => { event.preventDefault(); void run(async () => {
      await apiPost(path, { reason: reason.trim(), duration_days: Number(days) });
      setReason(""); await reload(); setMessage("警告已发出，已通知该用户");
    }, true); }}>
      <Field label="警告原因" htmlFor="warning-reason" required><Textarea id="warning-reason" required minLength={2} maxLength={1000} disabled={busy} value={reason} onChange={(event) => setReason(event.target.value)} /></Field>
      <Field label="有效天数（0 为永久）" htmlFor="warning-duration" hint="只影响本次警告；限期警告到期后扣除一次，其他警告不受影响。"><Input id="warning-duration" required type="number" min={0} max={3650} step={1} disabled={busy} value={days} onChange={(event) => setDays(event.target.value)} /></Field>
      <div><Button type="submit" variant="primary" disabled={busy}>{busy ? "处理中…" : "发出警告"}</Button></div>
    </form>}
    <div className="mb-3 flex flex-wrap gap-2">
      <Button disabled={busy} onClick={() => void run(() => reload(), true)}>刷新警告记录</Button>
      {canSettle && <Button disabled={busy} onClick={() => void run(async () => {
        const result = await apiPost<SettleWarningsResponse>(`${path}/settle`, {});
        await reload(); setMessage(`已结算 ${String(result.expired)} 条到期警告`);
      }, true)}>结算已到期警告</Button>}
    </div>
    {data.items.length === 0 ? <p className="text-sm text-fg-1">暂无逐条警告记录；累计次数可能包含历史警告或考核处罚。</p> : <div className="grid gap-3">
      {data.items.map((item) => <article key={item.id} className="rounded-sm border border-line p-3 text-sm">
        <p className="mb-2 whitespace-pre-wrap break-words">{item.reason}</p>
        <p className="text-xs text-fg-2">发出：{timestamp(item.created_at)} · {item.expired_at !== null ? `已到期解除：${timestamp(item.expired_at)}` : item.revoked_at !== null ? "管理员重设总数，已取消自动到期" : item.expires_at === null ? "永久警告" : `到期：${timestamp(item.expires_at)}`}</p>
      </article>)}
    </div>}
    {data.next_cursor !== null && <Button className="mt-3" disabled={busy} onClick={() => void run(() => reload(data.next_cursor ?? undefined))}>加载更多警告</Button>}
  </Panel>;
}
