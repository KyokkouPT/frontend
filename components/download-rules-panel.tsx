"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DownloadRulesResponse } from "@kyokkou/contracts";
import { ApiClientError, apiPost } from "@/lib/api/client";
import { Markdown } from "./markdown";
import { Notice } from "./notice";
import { Button } from "./ui/button";
import { Panel } from "./ui/panel";

export function DownloadRulesPanel({ initial }: { initial: DownloadRulesResponse }) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [checked, setChecked] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return <Panel title={`下载规则${data.version ? ` · 版本 ${String(data.version)}` : ""}`} description="确认记录绑定当前账号；管理员发布新版本后需重新确认，RSS 和签名下载同样检查。">
    {data.version > 0 ? <Markdown>{data.markdown}</Markdown> : <p className="text-sm text-fg-1">站点尚未发布下载确认规则。</p>}
    {!data.required ? <Notice tone="info" className="mt-4">{data.accepted ? "当前版本已确认，网页下载、RSS 和签名下载均可继续使用。" : "站点当前未要求确认下载规则。"}</Notice> : <div className="mt-4 grid gap-3">
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={checked} disabled={pending} onChange={(event) => setChecked(event.target.checked)} />
        我已阅读并同意当前版本的下载规则及保种义务</label>
      <Button variant="primary" disabled={!checked || pending} onClick={() => { void (async () => {
        setPending(true); setError(null);
        try { setData(await apiPost<DownloadRulesResponse>("/api/v1/download-rules/accept", { version: data.version })); router.refresh(); }
        catch (caught) { setError(caught instanceof ApiClientError ? caught.message : "确认失败，请稍后重试"); }
        finally { setPending(false); }
      })(); }}>{pending ? "提交中…" : "确认当前版本"}</Button>
    </div>}
    {error && <Notice tone="warn" className="mt-3">{error} <button className="underline" onClick={() => window.location.reload()}>重新加载规则</button></Notice>}
    <div className="mt-4 flex gap-4 text-sm text-accent"><Link href="/browse">返回浏览</Link><Link href="/me/rss">RSS 订阅</Link></div>
  </Panel>;
}
