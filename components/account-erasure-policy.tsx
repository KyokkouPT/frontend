"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AccountErasureSettings, AccountErasurePreviewResponse } from "@kyokkou/contracts";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { Panel } from "./ui/panel";
import { Button } from "./ui/button";
import { Field, Input } from "./ui/field";
import { Notice } from "./notice";

const ACTIONS = { none: "无需处理", notify: "待提前通知", wait: "通知期内", anonymize: "到期，待匿名化", blocked: "存在阻塞事项", anonymized: "已匿名化" };
const REASONS = { not_inactivity_suspended: "不在不活跃停用范围", staff_exempt: "管理账号豁免", rank_exempt: "等级豁免",
  class_unknown: "等级资料缺失，跳过", retention: "保留期内", eligible: "符合条件", blocked: "待处理事项", anonymized: "历史匿名主体" };
const BLOCKERS: Record<string, string> = { unsettled_request: "未结求种悬赏", unsettled_redemption: "未结兑换", open_appeal: "待处理申诉", open_report: "待处理举报", open_anomaly: "待复核异常", active_assessment: "进行中的考核" };
const date = (value: number | null) => value === null ? "—" : new Date(value).toLocaleString("zh-CN", { hour12: false });

export function AccountErasurePolicy({ initial, initialState }: { initial: AccountErasureSettings; initialState: AccountErasurePreviewResponse }) {
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [current, setCurrent] = useState(initialState);
  const [preview, setPreview] = useState<AccountErasurePreviewResponse | null>(null);
  const [reviewed, setReviewed] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const dirty = JSON.stringify(saved) !== JSON.stringify(draft);
  const validPreview = reviewed === JSON.stringify(draft.policy) && preview?.revision === draft.revision && Boolean(preview?.preview_token);
  function fail(caught: unknown) { setError(caught instanceof ApiClientError ? caught.fields?.[0]?.message ?? caught.message : caught instanceof Error ? caught.message : "操作失败，请重试"); }

  async function loadPreview(afterId = 0) {
    setBusy(true); setError(null); setMessage(null);
    try {
      const next = await apiFetch<AccountErasurePreviewResponse>("/api/v1/staff/account-erasure/preview", { method: "POST",
        body: JSON.stringify({ policy: draft.policy, after_id: afterId, limit: 50 }) });
      if (next.revision !== draft.revision) throw new Error("策略已修改，请刷新后重新预览");
      setPreview((previous) => ({ ...next, items: afterId ? [...(previous?.items ?? []), ...next.items] : next.items }));
      setReviewed(JSON.stringify(draft.policy));
    } catch (caught) { setReviewed(null); fail(caught); }
    finally { setBusy(false); }
  }
  async function refresh(afterId = 0) {
    setBusy(true); setError(null); setMessage(null);
    try {
      const [settings, state] = await Promise.all([
        apiFetch<AccountErasureSettings>("/api/v1/staff/account-erasure"),
        apiFetch<AccountErasurePreviewResponse>(`/api/v1/staff/account-erasure/preview?after_id=${afterId}&limit=50`),
      ]);
      if (state.revision !== settings.revision || (afterId > 0 && state.revision !== current.revision)) throw new Error("策略已修改，请重新刷新");
      setCurrent((previous) => ({ ...state, items: afterId ? [...previous.items, ...state.items] : state.items }));
      if (settings.revision !== saved.revision) { setDraft(settings); setSaved(settings); setReviewed(null); setPreview(null); }
    } catch (caught) { fail(caught); }
    finally { setBusy(false); }
  }
  async function save() {
    if (draft.enabled && !window.confirm("确认启用自动匿名化？符合条件的账号将在保留期和提前通知期结束后永久清除个人资料与认证凭证，历史业务记录保留。此操作不可恢复。")) return;
    setBusy(true); setError(null); setMessage(null);
    try {
      const next = await apiFetch<AccountErasureSettings>("/api/v1/staff/account-erasure", { method: "PUT",
        body: JSON.stringify({ ...draft, ...(draft.enabled ? { preview_token: preview?.preview_token } : {}) }) });
      setSaved(next); setDraft(next); setPreview(null); setReviewed(null);
      setCurrent(await apiFetch<AccountErasurePreviewResponse>("/api/v1/staff/account-erasure/preview"));
      setMessage(next.enabled ? "匿名化策略已启用，后台将先发送提前通知" : "匿名化策略已关闭，待处理期限已取消");
      router.refresh();
    } catch (caught) { fail(caught); }
    finally { setBusy(false); }
  }
  return <Panel title="停用保留与匿名化" description="仅处理因不活跃而停用的账号。保留历史发布、账本、H&R 和审计关联，个人资料和认证凭证永久清除。">
    {error && <Notice tone="warn">{error}</Notice>}{message && <Notice tone="info">{message}</Notice>}
    <p className="mb-4 text-sm">已保存策略 <strong>{saved.enabled ? "已启用" : "已关闭"}</strong> · 版本 {saved.revision}</p>
    <form className="grid gap-3 sm:grid-cols-3" onSubmit={(event) => { event.preventDefault(); void loadPreview(); }}>
      {([
        ["retention_days", "停用保留期（天）", 36500], ["notice_days", "匿名化通知提前天数", 3650], ["exempt_rank", "匿名化豁免 rank 起点", 1000000],
      ] as const).map(([key, label, max]) => <Field key={key} label={label} htmlFor={`erasure-${key}`}><Input id={`erasure-${key}`} type="number" required min={1} max={max} disabled={busy} value={draft.policy[key]}
        onChange={(event) => { setDraft({ ...draft, policy: { ...draft.policy, [key]: Number(event.target.value) } }); setReviewed(null); setPreview(null); }} /></Field>)}
      <Button type="submit" disabled={busy}>{busy ? "处理中…" : "预览匿名化影响"}</Button>
    </form>
    <p className="my-3 text-xs text-fg-2">从停用或最近联系站点的时间起计算保留期。已超期账号也获得完整通知期。管理账号始终豁免。待处理事项阻止执行，处理完后重新通知。</p>
    <label className="my-3 flex items-center gap-2 text-sm"><input id="erasure-enabled" type="checkbox" checked={draft.enabled} disabled={busy} onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })} />启用自动匿名化</label>
    <div className="flex flex-wrap gap-3"><Button disabled={busy || !dirty || (draft.enabled && !validPreview)} onClick={() => void save()}>保存匿名化策略</Button><Button disabled={busy} onClick={() => void refresh()}>刷新匿名化状态</Button></div>
    {draft.enabled && dirty && !validPreview && <p className="mt-2 text-sm text-fg-1">保存启用前请预览当前参数，预览凭证有效期30分钟。</p>}
    {preview && <div className="mt-5"><h3 className="mb-2 text-sm font-semibold">草稿预览</h3><ErasureTable items={preview.items} />
      {preview.next_cursor !== null && <Button className="mt-3" disabled={busy} onClick={() => void loadPreview(preview.next_cursor!)}>加载更多匿名化预览</Button>}
    </div>}
    <h3 className="mb-2 mt-5 text-sm font-semibold">已保存策略状态 · {current.enabled ? "正在处理" : "已关闭"}</h3>
    <ErasureTable items={current.items} />
    {current.next_cursor !== null && <Button className="mt-3" disabled={busy} onClick={() => void refresh(current.next_cursor!)}>加载更多匿名化状态</Button>}
  </Panel>;
}

function ErasureTable({ items }: { items: AccountErasurePreviewResponse["items"] }) {
  if (!items.length) return <p className="text-sm text-fg-1">暂无账号。</p>;
  return <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-xs"><thead className="text-fg-2"><tr>
    {["账号", "原因", "下一步", "保留期至", "通知时间", "最早匿名化时间", "实际匿名化时间", "阻塞事项"].map((label) => <th className="p-2" key={label}>{label}</th>)}
  </tr></thead><tbody>{items.map((item) => <tr key={item.user_id} className="border-t border-line">
    <td className="p-2">{item.username}</td><td className="p-2">{REASONS[item.reason]}</td><td className="p-2">{ACTIONS[item.action]}</td>
    {[item.retention_until, item.notified_at, item.erase_at, item.anonymized_at].map((value, index) => <td className="whitespace-nowrap p-2" key={index}>{date(value)}</td>)}
    <td className="p-2">{item.blockers.map((blocker) => BLOCKERS[blocker] ?? blocker).join("、") || "—"}</td>
  </tr>)}</tbody></table></div>;
}
