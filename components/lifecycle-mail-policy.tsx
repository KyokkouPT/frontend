"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LifecycleMailStatus } from "@kyokkou/contracts";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { Panel } from "./ui/panel";
import { Button } from "./ui/button";
import { Notice } from "./notice";

export function LifecycleMailPolicy({ initial }: { initial: LifecycleMailStatus }) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [enabled, setEnabled] = useState(initial.enabled);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  async function update(save: boolean) {
    setBusy(true); setError(null); setMessage(null);
    try {
      const next = await apiFetch<LifecycleMailStatus>("/api/v1/staff/account-lifecycle/email", save
        ? { method: "PUT", body: JSON.stringify({ enabled, revision: state.revision }) } : {});
      setState(next); setEnabled(next.enabled);
      if (save) { setMessage("生命周期邮件设置已保存"); router.refresh(); }
    } catch (caught) { setError(caught instanceof ApiClientError ? caught.message : "邮件设置加载或保存失败，请重试"); }
    finally { setBusy(false); }
  }
  return <Panel title="生命周期邮件提醒" description="使用站点 SMTP 向已验证邮箱发送通知，发送失败自动重试。">
    {error && <Notice tone="warn">{error}</Notice>}{message && <Notice tone="info">{message}</Notice>}
    {!state.smtp_available && <Notice tone="warn">SMTP 尚未配置或暂不可用，邮件将等待邮件服务恢复。</Notice>}
    <label className="my-3 flex items-center gap-2 text-sm"><input id="lifecycle-mail-enabled" type="checkbox" checked={enabled} disabled={busy} onChange={(event) => setEnabled(event.target.checked)} />发送生命周期邮件提醒</label>
    <p className="mb-3 text-sm">待投递 {state.pending} · 失败待重试 {state.failed} · SMTP 已接受 {state.sent}</p>
    <div className="flex flex-wrap gap-3"><Button disabled={busy || enabled === state.enabled} onClick={() => void update(true)}>保存邮件提醒</Button><Button disabled={busy} onClick={() => void update(false)}>刷新投递状态</Button></div>
    <p className="mt-3 text-xs text-fg-2">新发出的通知会加入邮件队列，约每五分钟重试。关闭后取消待发邮件。SMTP 接受表示已交给邮件服务器。</p>
  </Panel>;
}
