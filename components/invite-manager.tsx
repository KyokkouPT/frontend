"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { InviteItem, InvitesResponse } from "@kyokkou/contracts";
import { ApiClientError, apiPost } from "@/lib/api/client";
import { formatDate, formatRelativeTime } from "@/lib/format";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { EmptyState } from "./ui/empty-state";
import { Field, Input } from "./ui/field";
import { Notice } from "./notice";

export function InviteManager({
  initial,
  requireEmail,
}: {
  initial: InvitesResponse;
  requireEmail: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState<InviteItem[]>(initial.items);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const unusedCount = items.filter(
    (item) => item.status === "unused" && item.expires_at > Date.now(),
  ).length;

  async function create() {
    setPending(true);
    setError(null);
    try {
      const created = await apiPost<InviteItem>("/api/v1/me/invites", {
        ...(email.trim() ? { email: email.trim() } : {}),
      });
      setItems((previous) => [created, ...previous]);
      setEmail("");
      router.refresh();
    } catch (createError) {
      setError(createError instanceof ApiClientError ? createError.message : "生成失败，请稍后重试");
    } finally {
      setPending(false);
    }
  }

  function inviteLink(item: InviteItem): string {
    const url = new URL("/signup", window.location.origin);
    url.searchParams.set("invite", item.code);
    if (item.email) url.searchParams.set("email", item.email);
    return url.toString();
  }

  async function copy(item: InviteItem) {
    try {
      await navigator.clipboard.writeText(inviteLink(item));
      setCopied(item.code);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setError("复制失败，请手动复制邀请链接");
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="accent">
          {unusedCount}/{initial.quota_total} 未使用
        </Badge>
        <span className="text-xs text-fg-2">邀请码 30 天内有效，一次性使用。</span>
        <Button
          variant="primary"
          className="ml-auto"
          disabled={pending || unusedCount >= initial.quota_total || (requireEmail && !email.trim())}
          onClick={() => void create()}
        >
          {pending ? "生成中…" : "生成邀请码"}
        </Button>
      </div>

      {requireEmail && (
        <Field
          label="预注册邮箱"
          htmlFor="invite-email"
          required
          hint="接收者必须用该邮箱注册，邀请链接会自动携带邮箱"
        >
          <Input
            id="invite-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="invitee@example.com"
          />
        </Field>
      )}

      {error && <Notice tone="warn">{error}</Notice>}

      {items.length === 0 ? (
        <EmptyState title="还没有邀请码" description="生成一个邀请码，发给朋友完成注册。" />
      ) : (
        <ul className="grid gap-2">
          {items.map((item) => (
            <li
              key={item.code}
              className="flex flex-wrap items-center gap-2 rounded-md border border-line bg-surface-1 p-3"
            >
              <code className="font-mono text-sm">{item.code}</code>
              <Badge tone={item.status === "unused" ? "ok" : "default"}>
                {item.status === "unused" ? "未使用" : "已使用"}
              </Badge>
              <span className="text-2xs text-fg-2">
                创建 {formatRelativeTime(item.created_at)} · 到期 {formatDate(item.expires_at)}
              </span>
              {item.invited_user && (
                <span className="text-2xs text-fg-2">已邀请：{item.invited_user}</span>
              )}
              {item.email && (
                <span className="text-2xs text-fg-2">预注册邮箱：{item.email}</span>
              )}
              {item.status === "unused" && (
                <Button variant="ghost" className="ml-auto" onClick={() => void copy(item)}>
                  {copied === item.code ? "已复制链接" : "复制邀请链接"}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
