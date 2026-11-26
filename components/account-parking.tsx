"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AccountParkingResponse, AccountLifecycleSettings } from "@kyokkou/contracts";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { Notice } from "./notice";
import { Button } from "./ui/button";
import { Panel } from "./ui/panel";

export function AccountParking({ initial }: { initial: AccountParkingResponse }) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  return <Panel title="账号停放" description="长期离站前可登记停放，返回后可随时解除。停放不免除已有 H&R、考核或交易义务，不改变下载与 Tracker 权限。">
    {error && <Notice tone="warn">{error}</Notice>}
    {message && <Notice tone="info">{message}</Notice>}
    <p className="mb-3 text-sm">{state.parked_at !== null ? `已停放 · ${formatDate(state.parked_at)}` : state.parking_enabled ? "账号当前未停放。" : "站点尚未开放账号停放。"}</p>
    {(state.parking_enabled || state.parked_at !== null) && <Button disabled={busy} onClick={() => { void (async () => {
      const parked = state.parked_at === null;
      setBusy(true); setError(null); setMessage(null);
      try {
        const next = await apiFetch<AccountParkingResponse>("/api/v1/me/lifecycle/parking", { method: "PUT", body: JSON.stringify({ parked }) });
        setState(next); setMessage(parked ? "账号已停放" : "已解除账号停放"); router.refresh();
      } catch (caught) { setError(caught instanceof ApiClientError ? caught.message : "停放状态保存失败，请重试"); }
      finally { setBusy(false); }
    })(); }}>{busy ? "保存中…" : state.parked_at !== null ? "解除账号停放" : "停放账号"}</Button>}
  </Panel>;
}

export function ParkingPolicy({ initial }: { initial: AccountLifecycleSettings }) {
  const router = useRouter();
  const [settings, setSettings] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  return <Panel title="账号停放策略" description="默认关闭。关闭后不接受新的停放，已停放用户仍能自行解除。">
    {error && <Notice tone="warn">{error}</Notice>}{message && <Notice tone="info">{message}</Notice>}
    <label className="mb-4 flex items-center gap-2 text-sm"><input id="parking-enabled" type="checkbox" checked={settings.parking_enabled} disabled={busy} onChange={(event) => setSettings({ parking_enabled: event.target.checked })} />允许用户自行停放账号</label>
    <Button variant="primary" disabled={busy} onClick={() => { void (async () => {
      setBusy(true); setError(null); setMessage(null);
      try {
        const result = await apiFetch<{ settings: AccountLifecycleSettings }>("/api/v1/staff/account-lifecycle", { method: "PUT", body: JSON.stringify(settings) });
        setSettings(result.settings); setMessage("账号停放策略已保存"); router.refresh();
      } catch (caught) { setError(caught instanceof ApiClientError ? caught.message : "策略保存失败，请重试"); }
      finally { setBusy(false); }
    })(); }}>{busy ? "保存中…" : "保存停放策略"}</Button>
    <p className="mt-3 text-xs text-fg-2">停放登记请假状态，不免除已有 H&amp;R 或考核义务。不活跃处理由下方独立策略控制。</p>
  </Panel>;
}
