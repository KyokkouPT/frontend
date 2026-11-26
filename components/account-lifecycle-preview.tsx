"use client";

import { useState } from "react";
import type { AccountLifecyclePreviewPolicy, AccountLifecyclePreviewResponse } from "@kyokkou/contracts";
import { ApiClientError, apiFetch } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { Button } from "./ui/button";
import { Field, Input } from "./ui/field";
import { Panel } from "./ui/panel";
import { Notice } from "./notice";

const REASONS: Record<string, string> = { status_exempt: "非正常状态，跳过", staff_exempt: "管理账号豁免", rank_exempt: "等级豁免", class_unknown: "等级资料缺失，保护性跳过",
  threshold_disabled: "此档已关闭", not_due: "未到通知时间", no_transfer: "无实际流量", inactive: "普通不活跃", parked: "已停放" };
const ACTIONS = { none: "无需处理", notify: "待提前通知", disable_candidate: "停用候选（仍须通知）" };
export function AccountLifecyclePreview() {
  const [draft, setDraft] = useState<AccountLifecyclePreviewPolicy>({ no_transfer_days: 30, inactive_days: 180, parked_days: 365, notice_days: 7, exempt_rank: 100 });
  const [applied, setApplied] = useState(draft);
  const [result, setResult] = useState<AccountLifecyclePreviewResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function preview(policy: AccountLifecyclePreviewPolicy, after = 0) {
    setBusy(true); setError(null);
    if (after === 0) setResult(null);
    try {
      const response = await apiFetch<AccountLifecyclePreviewResponse>("/api/v1/staff/account-lifecycle/preview", { method: "POST", body: JSON.stringify({ policy, after_id: after, limit: 50 }) });
      setResult((previous) => ({ ...response, items: after ? [...(previous?.items ?? []), ...response.items] : response.items }));
      setApplied(policy);
    } catch (caught) { setError(caught instanceof ApiClientError ? caught.fields?.map((field) => field.message).join("；") || caught.message : "策略试算失败，请重试"); }
    finally { setBusy(false); }
  }
  return <Panel title="不活跃策略试算（只读）" description="输入假设策略查看候选与豁免原因。试算不保存策略、不发送通知、不停用或销毁账号。">
    {error && <Notice tone="warn">{error}</Notice>}
    <form className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-3" onSubmit={(event) => { event.preventDefault(); void preview(draft); }}>
      {([
        ["no_transfer_days", "无实际流量阈值（天）", 0, 36500], ["inactive_days", "普通不活跃阈值（天）", 0, 36500],
        ["parked_days", "已停放阈值（天）", 0, 36500], ["notice_days", "通知提前天数", 1, 3650], ["exempt_rank", "豁免等级 rank 起点", 1, 1000000],
      ] as const).map(([key, label, min, max]) => <Field key={key} label={label} htmlFor={`lifecycle-preview-${key}`}>
        <Input id={`lifecycle-preview-${key}`} type="number" required min={min} max={max} disabled={busy} value={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: Number(event.target.value) })} />
      </Field>)}
      <Button type="submit" disabled={busy}>{busy ? "试算中…" : "预览候选账号"}</Button>
    </form>
    <p className="my-3 text-xs text-fg-2">阈值设为 0 关闭对应档位；停放档优先，其次按实际 Tracker 流量区分无流量与普通账号。活跃包含已认证网页/API 请求和有效 announce，最多延迟约 5 分钟写入。管理账号始终豁免。</p>
    {result === null ? <p className="text-sm text-fg-1">尚未试算。上方数值仅为试算示例，不会自动启用。</p> : <>
      <p className="mb-3 text-sm" role="status">试算完成 · {formatDate(result.evaluated_at)} · 已加载 {result.items.length} 个账号</p>
      {result.items.length === 0 ? <p className="text-sm text-fg-1">暂无可展示的账号。</p> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs">
        <thead className="text-fg-2"><tr><th className="p-2">账号</th><th className="p-2">等级</th><th className="p-2">最近活跃</th><th className="p-2">不活跃天数 / 阈值</th><th className="p-2">原因</th><th className="p-2">试算结果</th></tr></thead>
        <tbody>{result.items.map((item) => <tr className="border-t border-line" key={item.user_id}><td className="p-2">{item.username}</td><td className="p-2">{item.class_name ?? "未知"}</td><td className="whitespace-nowrap p-2">{formatDate(item.last_activity_at)}</td><td className="p-2">{item.inactive_days} / {item.threshold_days || "关闭"}</td><td className="p-2">{REASONS[item.reason]}</td><td className="p-2">{ACTIONS[item.action]}</td></tr>)}</tbody>
      </table></div>}
      {result.next_cursor !== null && <Button className="mt-3" disabled={busy} onClick={() => void preview(applied, result.next_cursor!)}>加载下一页</Button>}
    </>}
  </Panel>;
}
