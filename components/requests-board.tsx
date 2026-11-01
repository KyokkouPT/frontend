"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RequestActionResponse, RequestItem, RequestsResponse } from "@kyokkou/contracts";
import { ApiClientError, apiPost } from "@/lib/api/client";
import { formatNumber, formatRelativeTime } from "@/lib/format";
import { Avatar } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { EmptyState } from "./ui/empty-state";
import { Field, Input, Textarea } from "./ui/field";
import { Markdown } from "./markdown";
import { Notice } from "./notice";
import { Panel } from "./ui/panel";

const STATUS_LABEL: Record<string, string> = {
  open: "进行中",
  fulfilled: "已结算",
  cancelled: "已取消",
};

const STATUS_TONE = { open: "ok", fulfilled: "accent", cancelled: "default" } as const;

export function RequestsBoard({
  initial,
  meUsername,
  canSettle,
}: {
  initial: RequestsResponse;
  meUsername: string | null;
  canSettle: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState<RequestItem[]>(initial.items);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bounty, setBounty] = useState("500");
  const [deliverer, setDeliverer] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  async function refreshList() {
    const response = await fetch("/api/v1/requests", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as RequestsResponse;
    setItems(data.items);
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const value = Number(bounty);
    if (!Number.isInteger(value) || value <= 0) {
      setError("悬赏必须是正整数");
      return;
    }

    setPending("create");
    try {
      const result = await apiPost<RequestActionResponse>("/api/v1/requests", {
        title: title.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
        bounty: value,
      });
      setNotice(result.message);
      setTitle("");
      setDescription("");
      await refreshList();
      router.refresh();
    } catch (createError) {
      setError(
        createError instanceof ApiClientError
          ? (createError.fields?.[0]?.message ?? createError.message)
          : "发布失败，请稍后重试",
      );
    } finally {
      setPending(null);
    }
  }

  async function cancel(item: RequestItem) {
    setError(null);
    setNotice(null);
    setPending(`cancel-${String(item.id)}`);
    try {
      const result = await apiPost<RequestActionResponse>(
        `/api/v1/requests/${String(item.id)}/cancel`,
        {},
      );
      setNotice(result.message);
      await refreshList();
      router.refresh();
    } catch (cancelError) {
      setError(cancelError instanceof ApiClientError ? cancelError.message : "取消失败");
    } finally {
      setPending(null);
    }
  }

  async function settle(item: RequestItem) {
    const username = (deliverer[item.id] ?? "").trim();
    if (!username) {
      setError("请输入交付者用户名");
      return;
    }

    setError(null);
    setNotice(null);
    setPending(`settle-${String(item.id)}`);
    try {
      const result = await apiPost<RequestActionResponse>(
        `/api/v1/requests/${String(item.id)}/fulfill`,
        { username },
      );
      setNotice(result.message);
      await refreshList();
      router.refresh();
    } catch (settleError) {
      setError(settleError instanceof ApiClientError ? settleError.message : "结算失败");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="grid gap-6">
      {meUsername && (
        <Panel title="发布求种" description="悬赏会从魔力值余额中冻结，取消时退回">
          <form onSubmit={create} className="grid gap-3">
            <Field label="标题" htmlFor="request-title" required>
              <Input
                id="request-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                minLength={4}
                maxLength={190}
                placeholder="例如：求 4K 原盘《沙丘 2》国配版"
              />
            </Field>
            <Field label="说明" htmlFor="request-description" hint="支持 Markdown">
              <Textarea
                id="request-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="规格、字幕、来源等要求；支持 Markdown"
              />
            </Field>
            <Field label="悬赏（魔力值）" htmlFor="request-bounty" required>
              <Input
                id="request-bounty"
                type="number"
                min={1}
                value={bounty}
                onChange={(event) => setBounty(event.target.value)}
                required
              />
            </Field>
            <div>
              <Button type="submit" variant="primary" disabled={pending !== null}>
                发布
              </Button>
            </div>
          </form>
        </Panel>
      )}

      {notice && <Notice tone="info">{notice}</Notice>}
      {error && <Notice tone="warn">{error}</Notice>}

      <Panel title="求种列表" description="Staff 可以把悬赏结算给交付者" flush>
        {items.length === 0 ? (
          <EmptyState title="暂无求种" description="发布第一条求种吧。" />
        ) : (
          <ul className="divide-y divide-line">
            {items.map((item) => (
              <li key={item.id} className="grid gap-2 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={STATUS_TONE[item.status as keyof typeof STATUS_TONE] ?? "default"}>
                    {STATUS_LABEL[item.status] ?? item.status}
                  </Badge>
                  <b className="text-sm font-semibold">{item.title}</b>
                  <span className="ml-auto font-mono text-xs text-accent">
                    {formatNumber(item.bounty)} 魔力
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-2xs text-fg-2">
                  <Avatar
                    name={item.user.name}
                    hue={item.user.hue}
                    size="sm"
                    initial={item.user.name.slice(0, 1)}
                  />
                  <span>{item.user.name}</span>
                  {item.category && (
                    <>
                      <i className="not-italic opacity-55">·</i>
                      <span>{item.category.name}</span>
                    </>
                  )}
                  <i className="not-italic opacity-55">·</i>
                  <span>{formatRelativeTime(item.created_at)}</span>
                  {item.fulfilled_by && (
                    <>
                      <i className="not-italic opacity-55">·</i>
                      <span>交付者：{item.fulfilled_by}</span>
                    </>
                  )}
                </div>

                {item.description && (
                  <Markdown className="text-xs">{item.description}</Markdown>
                )}

                {(meUsername === item.user.name && item.status === "open") ||
                (canSettle && item.status === "open") ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {meUsername === item.user.name && item.status === "open" && (
                      <Button
                        variant="default"
                        onClick={() => void cancel(item)}
                        disabled={pending !== null}
                      >
                        取消并退款
                      </Button>
                    )}
                    {canSettle && item.status === "open" && (
                      <div className="flex items-center gap-2">
                        <Input
                          aria-label={`交付者 ${String(item.id)}`}
                          placeholder="交付者用户名"
                          value={deliverer[item.id] ?? ""}
                          onChange={(event) =>
                            setDeliverer((previous) => ({
                              ...previous,
                              [item.id]: event.target.value,
                            }))
                          }
                          className="h-9 w-40"
                        />
                        <Button
                          variant="primary"
                          onClick={() => void settle(item)}
                          disabled={pending !== null}
                        >
                          结算悬赏
                        </Button>
                      </div>
                    )}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
