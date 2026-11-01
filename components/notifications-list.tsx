"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { NotificationsResponse } from "@kyokkou/contracts";
import { ApiClientError, apiPost } from "@/lib/api/client";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { EmptyState } from "./ui/empty-state";
import { Markdown } from "./markdown";
import { Notice } from "./notice";

export function NotificationsList({ initial }: { initial: NotificationsResponse }) {
  const router = useRouter();
  const [items, setItems] = useState(initial.items);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const unread = items.filter((item) => item.read_at === null).length;

  async function markAll() {
    setPending(true);
    setError(null);
    try {
      await apiPost("/api/v1/notifications/read-all");
      setItems((previous) => previous.map((item) => ({ ...item, read_at: item.read_at ?? Date.now() })));
      router.refresh();
    } catch (markError) {
      setError(markError instanceof ApiClientError ? markError.message : "操作失败");
    } finally {
      setPending(false);
    }
  }

  async function markOne(id: number) {
    setError(null);
    try {
      await apiPost(`/api/v1/notifications/${String(id)}/read`);
      setItems((previous) =>
        previous.map((item) => (item.id === id ? { ...item, read_at: item.read_at ?? Date.now() } : item)),
      );
      router.refresh();
    } catch (markError) {
      setError(markError instanceof ApiClientError ? markError.message : "操作失败");
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={unread > 0 ? "accent" : "default"}>{unread} 未读</Badge>
        <Button variant="default" className="ml-auto" onClick={() => void markAll()} disabled={pending || unread === 0}>
          {pending ? "处理中…" : "全部标为已读"}
        </Button>
      </div>

      {error && <Notice tone="warn">{error}</Notice>}

      {items.length === 0 ? (
        <EmptyState title="暂无通知" description="审核结果、H&R、邀请等事件会出现在这里。" />
      ) : (
        <ul className="grid gap-2">
          {items.map((item) => (
            <li
              key={item.id}
              className={cn(
                "rounded-md border border-line bg-surface-1 p-4",
                item.read_at === null && "border-l-2 border-l-accent",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <b className="text-sm font-semibold">{item.title}</b>
                {item.read_at === null && <Badge tone="accent">未读</Badge>}
                <span className="ml-auto text-2xs text-fg-2">{formatRelativeTime(item.created_at)}</span>
              </div>
              <Markdown className="mt-1 text-xs">{item.body}</Markdown>
              <div className="mt-2 flex items-center gap-3 text-xs">
                {item.link_url && (
                  <Link href={item.link_url} className="text-accent hover:underline">
                    查看详情
                  </Link>
                )}
                {item.read_at === null && (
                  <button
                    type="button"
                    onClick={() => void markOne(item.id)}
                    className="text-fg-2 transition-colors hover:text-fg-0"
                  >
                    标为已读
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
