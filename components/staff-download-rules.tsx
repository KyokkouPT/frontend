"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { StaffDownloadRulesResponse } from "@kyokkou/contracts";
import { ApiClientError, apiFetch, apiPost } from "@/lib/api/client";
import { Markdown } from "./markdown";
import { Notice } from "./notice";
import { Panel } from "./ui/panel";
import { Button } from "./ui/button";
import { Field, Textarea } from "./ui/field";

export function StaffDownloadRules({ initial }: { initial: StaffDownloadRulesResponse }) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [markdown, setMarkdown] = useState(initial.draft_markdown);
  const [enabled, setEnabled] = useState(initial.enabled);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  async function run(publish: boolean) {
    if (publish && !window.confirm("发布将启用下载确认，并要求所有账号重新确认；未确认的 RSS 和签名下载也会拒绝。确定发布？")) return;
    setPending(true); setError(null); setMessage(null);
    try {
      if (publish) await apiPost("/api/v1/staff/download-rules/publish", { revision: data.draft_revision });
      else await apiFetch("/api/v1/staff/download-rules", { method: "PUT", body: JSON.stringify({ markdown, revision: data.draft_revision, enabled }) });
      const current = await apiFetch<StaffDownloadRulesResponse>("/api/v1/staff/download-rules");
      setData(current); setMarkdown(current.draft_markdown); setEnabled(current.enabled);
      setMessage(publish ? "新版本已发布，账号需要重新确认" : "草稿及启用状态已保存；草稿修改未发布"); router.refresh();
    } catch (caught) { setError(caught instanceof ApiClientError ? caught.message : "保存失败，请稍后重试"); }
    finally { setPending(false); }
  }
  const dirty = markdown !== data.draft_markdown || enabled !== data.enabled;
  return <div className="grid gap-5">
    {error && <Notice tone="warn">{error} <button className="underline" onClick={() => window.location.reload()}>重新加载</button></Notice>}
    {message && <Notice tone="info">{message}</Notice>}
    <Panel title="编辑草稿" description="保存草稿不生成新版本；只有明确发布才触发重新确认。默认未发布、不限制下载。">
      <Field label="下载规则（Markdown）" htmlFor="download-rules-markdown"><Textarea id="download-rules-markdown" rows={12} maxLength={20000} value={markdown} onChange={(event) => setMarkdown(event.target.value)} /></Field>
      <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={enabled} disabled={data.version === 0 || pending} onChange={(event) => setEnabled(event.target.checked)} />启用当前已发布版本的下载确认</label>
      <div className="mt-4 flex flex-wrap gap-3"><Button disabled={pending} onClick={() => void run(false)}>保存草稿与状态</Button>
        <Button variant="primary" disabled={pending || dirty || !data.draft_markdown.trim()} onClick={() => void run(true)}>发布新版本并要求确认</Button></div>
    </Panel>
    <Panel title={`已发布版本：${String(data.version)}`} description={data.enabled ? "正在执行确认检查" : "确认检查未启用"}>
      {data.version > 0 ? <Markdown>{data.markdown}</Markdown> : <p className="text-sm text-fg-1">暂无已发布规则。</p>}
    </Panel>
  </div>;
}
