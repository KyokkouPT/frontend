"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { LoginSecuritySettings, LoginEventsResponse, SharedIpsResponse } from "@kyokkou/contracts";
import { ApiClientError, apiFetch } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { Notice } from "./notice";
import { Panel } from "./ui/panel";
import { Field, Input, Select } from "./ui/field";
import { Button } from "./ui/button";

const OUTCOMES: Record<string, string> = { success: "登录成功", invalid_credentials: "密码错误或账号不存在", twofa_failure: "两步验证失败",
  twofa_required: "等待两步验证码", blocked: "超过失败次数上限", account_banned: "账号封禁", account_unavailable: "账号不可用", email_unverified: "邮箱未验证", pending_review: "等待审核" };
type Filters = { ip: string; userId: string; outcome: string };
export function StaffLoginSecurity({ initial, initialEvents, initialShared, canEdit }: {
  initial: LoginSecuritySettings; initialEvents: LoginEventsResponse; initialShared: SharedIpsResponse; canEdit: boolean;
}) {
  const router = useRouter();
  const [settings, setSettings] = useState(initial);
  const [events, setEvents] = useState(initialEvents);
  const [shared, setShared] = useState(initialShared);
  const [draft, setDraft] = useState<Filters>({ ip: "", userId: "", outcome: "" });
  const [applied, setApplied] = useState(draft);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const request = useRef(0);
  async function load(filters: Filters, before?: string) {
    const id = ++request.current;
    setLoading(true); setError(null);
    const query = new URLSearchParams({ limit: "50" });
    if (filters.ip.trim()) query.set("ip", filters.ip.trim());
    if (filters.userId) query.set("user_id", filters.userId);
    if (filters.outcome) query.set("outcome", filters.outcome);
    if (before) query.set("before", before);
    try {
      const [result, addresses] = await Promise.all([apiFetch<LoginEventsResponse>(`/api/v1/staff/login-events?${query}`), apiFetch<SharedIpsResponse>("/api/v1/staff/shared-ips")]);
      if (id !== request.current) return;
      setEvents((previous) => ({ ...result, items: before ? [...previous.items, ...result.items] : result.items }));
      setShared(addresses); setApplied(filters);
    } catch (caught) { if (id === request.current) setError(caught instanceof ApiClientError ? caught.message : "登录记录加载失败"); }
    finally { if (id === request.current) setLoading(false); }
  }
  return <div className="grid gap-5">
    {error && <Notice tone="warn">{error}</Notice>}
    {message && <Notice tone="info">{message}</Notice>}
    <Panel title="登录失败限制与记录" description="默认关闭。启用后按账号与 IP 统计滚动时间窗内的失败；用户名和邮箱共用账号额度。原有接口限流继续生效。">
      <label className="flex items-center gap-2 text-sm"><input id="login-security-enabled" type="checkbox" disabled={!canEdit || saving} checked={settings.enabled} onChange={(event) => setSettings({ ...settings, enabled: event.target.checked })} />启用登录安全记录与失败限制</label>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {([
          ["max_failures_per_ip", "同 IP 失败次数上限", 10000], ["max_failures_per_account", "同账号失败次数上限", 10000],
          ["window_minutes", "滚动时间窗（分钟）", 1440], ["retention_days", "记录保留天数", 3650],
        ] as const).map(([key, label, max]) => <Field key={key} label={label} htmlFor={`login-security-${key}`}>
          <Input id={`login-security-${key}`} type="number" min={1} max={max} disabled={!canEdit || saving} value={settings[key]}
            onChange={(event) => setSettings({ ...settings, [key]: Number(event.target.value) })} />
        </Field>)}
      </div>
      {canEdit && <Button className="mt-4" variant="primary" disabled={saving} onClick={() => { void (async () => {
        setSaving(true); setError(null); setMessage(null);
        try { const result = await apiFetch<{ settings: LoginSecuritySettings }>("/api/v1/staff/login-security", { method: "PUT", body: JSON.stringify(settings) });
          setSettings(result.settings); setMessage("登录安全策略已保存，立即生效"); router.refresh(); }
        catch (caught) { setError(caught instanceof ApiClientError ? caught.message : "保存失败"); }
        finally { setSaving(false); }
      })(); }}>{saving ? "保存中…" : "保存登录安全策略"}</Button>}
      <p className="mt-3 text-xs text-fg-2">超过上限只暂停新的登录尝试，不封禁账号；等待时间窗过期后自动恢复。被拦截的尝试不会延长窗口。记录仅向有 IP 查看权限的站务开放。</p>
    </Panel>
    <Panel title="登录与失败历史" description="失败记录关联的账号可能是被尝试的目标，不代表账号本人操作。IP 信息不进行外部地理查询。">
      <form className="mb-4 grid items-end gap-3 sm:grid-cols-4" onSubmit={(event) => { event.preventDefault(); void load(draft); }}>
        <Field label="IP 地址" htmlFor="login-filter-ip"><Input id="login-filter-ip" value={draft.ip} onChange={(event) => setDraft({ ...draft, ip: event.target.value })} /></Field>
        <Field label="用户 ID" htmlFor="login-filter-user"><Input id="login-filter-user" type="number" min={1} value={draft.userId} onChange={(event) => setDraft({ ...draft, userId: event.target.value })} /></Field>
        <Field label="结果" htmlFor="login-filter-outcome"><Select id="login-filter-outcome" value={draft.outcome} onChange={(event) => setDraft({ ...draft, outcome: event.target.value })}>
          <option value="">全部</option>{Object.entries(OUTCOMES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </Select></Field>
        <Button type="submit" disabled={loading}>{loading ? "加载中…" : "筛选 / 刷新"}</Button>
      </form>
      {events.items.length === 0 ? <p className="text-sm text-fg-1">没有符合条件的登录记录。只有启用策略后才开始记录。</p> : <div className="overflow-x-auto">
        <table className="w-full text-left text-xs"><thead className="text-fg-2"><tr><th className="p-2">时间</th><th className="p-2">关联账号</th><th className="p-2">IP</th><th className="p-2">结果</th><th className="p-2">客户端</th></tr></thead>
          <tbody>{events.items.map((item) => <tr key={item.id} className="border-t border-line"><td className="whitespace-nowrap p-2">{formatDate(item.created_at)}</td><td className="p-2">{item.username ?? "未匹配账号"}</td><td className="whitespace-nowrap p-2 font-mono">{item.ip}</td><td className="p-2">{OUTCOMES[item.outcome] ?? item.outcome}</td><td className="max-w-80 truncate p-2" title={item.user_agent}>{item.user_agent || "未提供"}</td></tr>)}</tbody>
        </table>
      </div>}
      {events.next_cursor && <Button className="mt-4" disabled={loading} onClick={() => void load(applied, events.next_cursor ?? undefined)}>加载更多</Button>}
    </Panel>
    <Panel title="重复 IP 检查" description="仅统计保留期内成功登录的不同账号；同一 IP 不代表同一人，不自动处罚。最多显示 100 个 IP。">
      {shared.items.length === 0 ? <p className="text-sm text-fg-1">暂无多个账号成功登录的共同 IP。</p> : <div className="grid gap-2">
        {shared.items.map((item) => <div key={item.ip} className="flex flex-wrap items-center gap-3 text-sm"><code>{item.ip}</code><span>{item.users} 个账号</span><span className="text-xs text-fg-2">最近：{formatDate(item.last_login_at)}</span>
          <button className="text-accent underline" onClick={() => { const next = { ip: item.ip, userId: "", outcome: "success" }; setDraft(next); void load(next); }}>查看记录</button></div>)}
      </div>}
    </Panel>
  </div>;
}
