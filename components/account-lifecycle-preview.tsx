"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AccountLifecyclePreviewPolicy, AccountLifecyclePreviewResponse, InactivityPolicy, InactivityPreviewResponse } from "@kyokkou/contracts";
import { ApiClientError, apiFetch } from "@/lib/api/client";
import { Button } from "./ui/button";
import { Field, Input } from "./ui/field";
import { Panel } from "./ui/panel";
import { Notice } from "./notice";

const REASONS: Record<string, string> = { status_exempt: "非正常状态，跳过", staff_exempt: "管理账号豁免", rank_exempt: "等级豁免", class_unknown: "等级资料缺失，保护性跳过",
  threshold_disabled: "此档已关闭", not_due: "未到通知时间", no_transfer: "无实际流量", inactive: "普通不活跃", parked: "已停放" };
const ACTIONS = { none: "无需处理", notify: "待提前通知", disable_candidate: "已超期，仍须完整通知期" };
const NEXT = { none: "无需处理", notify: "待发送通知", wait: "通知期内", suspend: "到期，待停用", suspended: "因不活跃已停用" };
const date = (value: number | null) => value === null ? "—" : new Date(value).toLocaleString("zh-CN", { hour12: false });

export function AccountLifecyclePreview({ initial, initialState }: { initial: InactivityPolicy; initialState: InactivityPreviewResponse }) {
  const router = useRouter();
  const [draft, setDraft] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [state, setState] = useState(initialState);
  const [applied, setApplied] = useState(draft.policy);
  const [result, setResult] = useState<AccountLifecyclePreviewResponse | null>(null);
  const [reviewed, setReviewed] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const needsPreview = dirty && draft.enabled && reviewed !== JSON.stringify(draft.policy);
  function failure(caught: unknown) { setError(caught instanceof ApiClientError ? caught.fields?.map((field) => field.message).join("；") || caught.message : caught instanceof Error ? caught.message : "操作失败，请重试"); }
  async function preview(policy: AccountLifecyclePreviewPolicy, after = 0) {
    setBusy(true); setError(null); setMessage(null);
    if (after === 0) { setResult(null); setReviewed(null); }
    try {
      const response = await apiFetch<AccountLifecyclePreviewResponse>("/api/v1/staff/account-lifecycle/preview", { method: "POST", body: JSON.stringify({ policy, after_id: after, limit: 50 }) });
      setResult((previous) => ({ ...response, items: after ? [...(previous?.items ?? []), ...response.items] : response.items }));
      setApplied(policy); setReviewed(JSON.stringify(policy));
    } catch (caught) { failure(caught); }
    finally { setBusy(false); }
  }
  async function refresh(after = 0) {
    setBusy(true); setError(null);
    try {
      const [settings, response] = await Promise.all([
        apiFetch<InactivityPolicy>("/api/v1/staff/account-inactivity"),
        apiFetch<InactivityPreviewResponse>(`/api/v1/staff/account-inactivity/preview?after_id=${after}&limit=50`),
      ]);
      if (settings.revision !== response.revision || (after > 0 && response.revision !== state.revision)) throw new Error("策略已变更，请刷新");
      setState((previous) => ({ ...response, items: after ? [...previous.items, ...response.items] : response.items }));
      if (settings.revision !== saved.revision) { setDraft(settings); setSaved(settings); setReviewed(null); setResult(null); }
    } catch (caught) { failure(caught); }
    finally { setBusy(false); }
  }
  async function save() {
    if (draft.enabled && !window.confirm("保存后将按此策略自动发送站内通知，并在完整通知期结束后停用仍不活跃的账号。确认启用？")) return;
    setBusy(true); setError(null); setMessage(null);
    try {
      const response = await apiFetch<InactivityPolicy>("/api/v1/staff/account-inactivity", { method: "PUT", body: JSON.stringify(draft) });
      setDraft(response); setSaved(response); setReviewed(null); setResult(null);
      setMessage(response.enabled ? "不活跃策略已保存并启用；后台每五分钟处理一批账号。" : "不活跃策略已保存，自动处理已关闭。");
      setState(await apiFetch<InactivityPreviewResponse>("/api/v1/staff/account-inactivity/preview"));
      router.refresh();
    } catch (caught) { failure(caught); }
    finally { setBusy(false); }
  }
  return <>
    <Panel title="不活跃通知与自动停用" description="默认关闭。先预览再启用；仅发送站内通知和停用账号，历史发布与账本保留。">
      {error && <Notice tone="warn">{error}</Notice>}{message && <Notice tone="info">{message}</Notice>}
      <p className="mb-4 text-sm">当前已保存策略：<strong>{saved.enabled ? "已启用" : "已关闭"}</strong> · 版本 {saved.revision}</p>
      <form className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-3" onSubmit={(event) => { event.preventDefault(); void preview(draft.policy); }}>
        {([
          ["no_transfer_days", "无实际流量阈值（天）", 0, 36500], ["inactive_days", "普通不活跃阈值（天）", 0, 36500],
          ["parked_days", "已停放阈值（天）", 0, 36500], ["notice_days", "通知提前天数", 1, 3650], ["exempt_rank", "豁免等级 rank 起点", 1, 1000000],
        ] as const).map(([key, label, min, max]) => <Field key={key} label={label} htmlFor={`lifecycle-preview-${key}`}>
          <Input id={`lifecycle-preview-${key}`} type="number" required min={min} max={max} disabled={busy} value={draft.policy[key]} onChange={(event) => { setDraft({ ...draft, policy: { ...draft.policy, [key]: Number(event.target.value) } }); setMessage(null); }} />
        </Field>)}
        <Button type="submit" disabled={busy}>{busy ? "处理中…" : "预览草稿影响"}</Button>
      </form>
      <p className="my-3 text-xs text-fg-2">阈值 0 关闭对应档位，启用档位必须大于通知提前天数。停放档优先，其次按实际 Tracker 流量区分档位。管理账号始终豁免。已超期账号也获得完整通知期。</p>
      <label className="my-3 flex items-center gap-2 text-sm"><input id="inactivity-enabled" type="checkbox" checked={draft.enabled} disabled={busy} onChange={(event) => { setDraft({ ...draft, enabled: event.target.checked }); setMessage(null); }} />启用不活跃通知与自动停用</label>
      <div className="flex flex-wrap gap-3"><Button variant="primary" disabled={busy || !dirty || needsPreview} onClick={() => void save()}>保存不活跃策略</Button><Button disabled={busy} onClick={() => void refresh()}>刷新执行状态</Button></div>
      {needsPreview && <p className="mt-2 text-sm text-fg-1">请先预览当前草稿，再保存启用。</p>}
      <p className="mt-3 text-xs text-fg-2">恢复活跃、改变停放状态或修改策略会使旧通知失效。关闭策略会取消待停用；已停用账号须由站务恢复。此处不会销毁账号。</p>
      {result && <div className="mt-5"><h3 className="mb-2 text-sm font-semibold">草稿试算 · 已加载 {result.items.length} 个账号（尚未保存）</h3>
        {JSON.stringify(applied) !== JSON.stringify(draft.policy) && <Notice tone="warn">输入已改变，下方为上次草稿的试算结果，请重新预览。</Notice>}
        <CandidateTable items={result.items} />
        {result.next_cursor !== null && <Button className="mt-3" disabled={busy} onClick={() => void preview(applied, result.next_cursor!)}>加载更多试算账号</Button>}
      </div>}
    </Panel>
    <Panel title="已保存策略的执行状态" description={`版本 ${state.revision} · ${state.enabled ? "正在自动处理" : "自动处理关闭"} · 更新于 ${date(state.evaluated_at)}`}>
      {state.items.length === 0 ? <p className="text-sm text-fg-1">暂无账号记录。</p> : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-xs">
        <thead className="text-fg-2"><tr><th className="p-2">账号</th><th className="p-2">原因</th><th className="p-2">下一步</th><th className="p-2">通知时间</th><th className="p-2">最早停用时间</th><th className="p-2">实际停用时间</th></tr></thead>
        <tbody>{state.items.map((item) => <tr className="border-t border-line" key={item.user_id}><td className="p-2">{item.username}</td><td className="p-2">{REASONS[item.reason]}</td><td className="p-2">{NEXT[item.next_action]}</td><td className="whitespace-nowrap p-2">{date(item.notified_at)}</td><td className="whitespace-nowrap p-2">{date(item.disable_at)}</td><td className="whitespace-nowrap p-2">{date(item.disabled_at)}</td></tr>)}</tbody>
      </table></div>}
      {state.next_cursor !== null && <Button className="mt-3" disabled={busy} onClick={() => void refresh(state.next_cursor!)}>加载更多执行记录</Button>}
    </Panel>
  </>;
}
function CandidateTable({ items }: { items: AccountLifecyclePreviewResponse["items"] }) {
  if (!items.length) return <p className="text-sm text-fg-1">暂无可展示的账号。</p>;
  return <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs">
    <thead className="text-fg-2"><tr><th className="p-2">账号</th><th className="p-2">等级</th><th className="p-2">最近活跃</th><th className="p-2">不活跃天数 / 阈值</th><th className="p-2">原因</th><th className="p-2">试算结果</th></tr></thead>
    <tbody>{items.map((item) => <tr className="border-t border-line" key={item.user_id}><td className="p-2">{item.username}</td><td className="p-2">{item.class_name ?? "未知"}</td><td className="whitespace-nowrap p-2">{date(item.last_activity_at)}</td><td className="p-2">{item.inactive_days} / {item.threshold_days || "关闭"}</td><td className="p-2">{REASONS[item.reason]}</td><td className="p-2">{ACTIONS[item.action]}</td></tr>)}</tbody>
  </table></div>;
}
