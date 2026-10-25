"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AppealItem } from "@kyokkou/contracts";
import { ApiClientError, apiPost } from "@/lib/api/client";
import { formatRelativeTime } from "@/lib/format";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Field, Input, Select, Textarea } from "./ui/field";
import { Notice } from "./notice";
import { Panel } from "./ui/panel";

const STATUS_LABEL: Record<string, string> = {
  open: "处理中",
  accepted: "已通过",
  rejected: "已驳回",
  withdrawn: "已撤回",
};

const KIND_LABEL: Record<string, string> = {
  bonus_freeze: "收益冻结",
  ban: "封禁",
  other: "其他",
};

export function AppealsPanel({ initial }: { initial: AppealItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [kind, setKind] = useState<"bonus_freeze" | "other">("other");
  const [reason, setReason] = useState("");
  const [comments, setComments] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  async function refresh() {
    const response = await fetch("/api/v1/me/appeals", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as { items: AppealItem[] };
    setItems(data.items);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending("create");
    setError(null);
    setNotice(null);
    try {
      await apiPost("/api/v1/me/appeals", { kind, reason: reason.trim() });
      setReason("");
      setNotice("申诉已提交，Staff 处理后会通知你");
      await refresh();
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "提交失败");
    } finally {
      setPending(null);
    }
  }

  async function comment(item: AppealItem) {
    const body = (comments[item.id] ?? "").trim();
    if (!body) return;
    setPending(`comment-${String(item.id)}`);
    setError(null);
    try {
      await apiPost(`/api/v1/me/appeals/${String(item.id)}/messages`, { body });
      setComments((previous) => ({ ...previous, [item.id]: "" }));
      await refresh();
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "发送失败");
    } finally {
      setPending(null);
    }
  }

  async function withdraw(item: AppealItem) {
    setPending(`withdraw-${String(item.id)}`);
    setError(null);
    try {
      await apiPost(`/api/v1/me/appeals/${String(item.id)}/withdraw`, {});
      setNotice("申诉已撤回");
      await refresh();
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "撤回失败");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="grid gap-6">
      {error && <Notice tone="warn">{error}</Notice>}
      {notice && <Notice tone="info">{notice}</Notice>}

      <Panel title="提交申诉" description="说明情况即可；账号被封禁时请使用免登录申诉入口">
        <form onSubmit={submit} className="grid gap-3">
          <Field label="类型" htmlFor="appeal-kind">
            <Select
              id="appeal-kind"
              value={kind}
              onChange={(event) => setKind(event.target.value as "bonus_freeze" | "other")}
            >
              <option value="other">其他</option>
              <option value="bonus_freeze">收益冻结</option>
            </Select>
          </Field>
          <Field label="说明" htmlFor="appeal-reason" required hint="至少 10 个字">
            <Textarea
              id="appeal-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              minLength={10}
              maxLength={2000}
              required
              placeholder="发生了什么、希望怎么处理"
            />
          </Field>
          <Button variant="primary" type="submit" disabled={pending !== null}>
            提交申诉
          </Button>
        </form>
      </Panel>

      <Panel title="我的申诉" flush>
        {items.length === 0 ? (
          <p className="p-4 text-sm text-fg-2">还没有申诉记录。</p>
        ) : (
          <ul className="divide-y divide-line">
            {items.map((item) => (
              <li key={item.id} className="grid gap-2 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={item.status === "open" ? "warn" : item.status === "accepted" ? "ok" : "default"}>
                    {STATUS_LABEL[item.status] ?? item.status}
                  </Badge>
                  <Badge tone="default">{KIND_LABEL[item.kind] ?? item.kind}</Badge>
                  <span className="text-2xs text-fg-2">{formatRelativeTime(item.created_at)}</span>
                </div>
                <p className="text-sm leading-relaxed">{item.reason}</p>
                {item.resolution_note && (
                  <p className="text-xs text-fg-2">处理说明：{item.resolution_note}</p>
                )}
                {item.messages.length > 0 && (
                  <ul className="grid gap-1 rounded-md bg-surface-2 p-2">
                    {item.messages.map((message) => (
                      <li key={`${String(item.id)}-${String(message.created_at)}`} className="text-xs">
                        <b className="text-fg-1">{message.author ?? "系统"}</b>
                        <span className="ml-1 text-fg-2">{formatRelativeTime(message.created_at)}</span>
                        <p className="mt-0.5 leading-relaxed text-fg-1">{message.body}</p>
                      </li>
                    ))}
                  </ul>
                )}
                {item.status === "open" && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      aria-label={`补充说明 ${String(item.id)}`}
                      placeholder="补充说明"
                      value={comments[item.id] ?? ""}
                      onChange={(event) =>
                        setComments((previous) => ({ ...previous, [item.id]: event.target.value }))
                      }
                      className="h-9 w-56"
                    />
                    <Button variant="default" onClick={() => void comment(item)} disabled={pending !== null}>
                      发送
                    </Button>
                    <Button variant="ghost" onClick={() => void withdraw(item)} disabled={pending !== null}>
                      撤回申诉
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
