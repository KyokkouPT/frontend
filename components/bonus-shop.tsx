"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Gift, Lock, Sparkles, X } from "lucide-react";
import type { ExchangeItem, ExchangeDirection } from "@kyokkou/contracts";
import { ApiClientError, apiPost } from "@/lib/api/client";
import { formatBonus, formatBytes } from "@/lib/format";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Field, Input, Textarea } from "./ui/field";
import { Notice } from "./notice";

const TYPE_LABEL: Record<string, string> = {
  upload_add: "上传量",
  download_add: "下载量",
  download_reduce: "下载减免",
  invite_add: "邀请名额",
  title_set: "自定义头衔",
  gift_bonus: "赠送魔力值",
  username_change: "修改用户名",
  hnr_clear: "H&R 清除机会",
  invite_sell: "出售邀请",
  upload_sell: "出售上传量",
};

function amountLabel(item: ExchangeItem): string | null {
  if (item.amount === null) return null;
  if (
    item.type === "upload_add" ||
    item.type === "download_add" ||
    item.type === "download_reduce" ||
    item.type === "upload_sell"
  ) {
    return formatBytes(item.amount);
  }
  if (item.type === "gift_bonus") return `${formatBonus(item.amount)} 魔力`;
  if (item.type === "hnr_clear") return `${String(item.amount)} 次机会`;
  if (item.type === "invite_add" || item.type === "invite_sell") {
    return `${String(item.amount)} 个邀请`;
  }
  return String(item.amount);
}

function newIdempotencyKey(prefix: string): string {
  const cryptoApi = globalThis.crypto;
  if (typeof cryptoApi?.randomUUID === "function") {
    return `${prefix}-${cryptoApi.randomUUID()}`;
  }

  // crypto.randomUUID 只在安全上下文（HTTPS/localhost）可用；
  // 局域网 HTTP 访问时退回 getRandomValues，再退回 Math.random。
  const bytes = new Uint8Array(16);
  if (typeof cryptoApi?.getRandomValues === "function") {
    cryptoApi.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${prefix}-${hex}`;
}

export function BonusShop({
  items,
  frozen,
  balance,
}: {
  items: ExchangeItem[];
  frozen: boolean;
  balance: number;
}) {
  const router = useRouter();
  const [direction, setDirection] = useState<ExchangeDirection>("buy");
  const [selected, setSelected] = useState<ExchangeItem | null>(null);
  const [title, setTitle] = useState("");
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!selected) return;
    function onKey(event: KeyboardEvent): void {
      if (event.key === "Escape" && !pending) setSelected(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, pending]);

  function open(item: ExchangeItem): void {
    setSelected(item);
    setTitle("");
    setRecipient("");
    setMessage("");
    setUsername("");
    setError(null);
  }

  async function confirm(): Promise<void> {
    if (!selected) return;
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      const params: Record<string, unknown> = {};
      if (selected.type === "title_set") params.title = title;
      if (selected.type === "gift_bonus") {
        params.recipient = recipient.trim();
        params.message = message.trim();
      }
      if (selected.type === "username_change") params.username = username.trim();
      const idempotencyKey = newIdempotencyKey(selected.key);
      const result = await apiPost<{ message: string }>(
        `/api/v1/me/exchange/${encodeURIComponent(selected.key)}`,
        { params, idempotency_key: idempotencyKey },
        { idempotencyKey },
      );
      setSuccess(result.message);
      setSelected(null);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof ApiClientError
          ? caught.message
          : caught instanceof Error
            ? `兑换失败：${caught.message}`
            : "兑换失败，请稍后重试",
      );
    } finally {
      setPending(false);
    }
  }

  const visible = items.filter((item) => item.direction === direction);
  const buyCount = items.filter((item) => item.direction === "buy").length;
  const sellCount = items.filter((item) => item.direction === "sell").length;

  return (
    <div className="grid gap-4">
      {success && <Notice tone="info">{success}</Notice>}
      {frozen && <Notice tone="warn">收益冻结期间不能兑换。</Notice>}

      <div className="flex items-center gap-1 rounded-sm border border-line bg-surface-0 p-1">
        {(
          [
            ["buy", `兑换${buyCount > 0 ? ` · ${String(buyCount)}` : ""}`],
            ["sell", `回收${sellCount > 0 ? ` · ${String(sellCount)}` : ""}`],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setDirection(value)}
            className={`h-8 flex-1 rounded-sm px-3 text-sm font-medium transition-colors ${
              direction === value
                ? "bg-accent/12 text-accent"
                : "text-fg-1 hover:bg-surface-2 hover:text-fg-0"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-md border border-dashed border-line p-8 text-center text-sm text-fg-2">
          {direction === "buy" ? "当前没有可兑换的商品。" : "当前没有回收项。"}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {visible.map((item) => {
            const amount = amountLabel(item);
            const disabled =
              frozen ||
              !item.affordable ||
              (item.remaining !== null && item.remaining <= 0) ||
              (item.user_remaining !== null && item.user_remaining <= 0);
            const buttonText =
              item.remaining !== null && item.remaining <= 0
                ? "已售罄"
                : item.user_remaining !== null && item.user_remaining <= 0
                  ? "已达上限"
                  : !item.affordable
                    ? direction === "buy"
                      ? "余额/资源不足"
                      : "资源不足"
                    : direction === "buy"
                      ? `兑换 · ${formatBonus(item.price)}`
                      : `回收 · +${formatBonus(item.price)}`;
            return (
              <div
                key={item.key}
                className="flex min-w-0 flex-col gap-2 rounded-md border border-line bg-surface-1 p-4"
              >
                <div className="flex items-start gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <b className="text-sm font-semibold">{item.name}</b>
                      <Badge tone="muted">{TYPE_LABEL[item.type] ?? item.type}</Badge>
                    </div>
                    {item.description && (
                      <p className="mt-1 text-xs leading-5 text-fg-2">{item.description}</p>
                    )}
                  </div>
                  {direction === "buy" ? (
                    <Lock className="ml-auto size-4 shrink-0 text-fg-2" />
                  ) : (
                    <Gift className="ml-auto size-4 shrink-0 text-fg-2" />
                  )}
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-2 text-xs text-fg-2">
                  {amount && <span>{amount}</span>}
                  {item.remaining !== null && (
                    <span>库存剩余 {String(item.remaining)}</span>
                  )}
                  {item.user_remaining !== null && (
                    <span>个人剩余 {String(item.user_remaining)}</span>
                  )}
                  {item.min_class_rank !== null && (
                    <span>需 rank ≥ {String(item.min_class_rank)}</span>
                  )}
                </div>

                <Button
                  variant="primary"
                  className="w-full"
                  disabled={disabled || pending}
                  onClick={() => open(item)}
                >
                  <Sparkles className="size-3.5" />
                  {buttonText}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-[200] grid place-items-center bg-black/45 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !pending) setSelected(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={selected.name}
            className="w-full max-w-md rounded-md border border-line bg-surface-1 p-4 shadow-xl"
          >
            <div className="flex items-start gap-2">
              <div>
                <h3 className="text-sm font-semibold">{selected.name}</h3>
                <p className="mt-0.5 text-xs text-fg-2">
                  {selected.direction === "buy"
                    ? `支付 ${formatBonus(selected.price)} 魔力值`
                    : `获得 ${formatBonus(selected.price)} 魔力值`}
                  {selected.direction === "buy" && selected.amount !== null && amountLabel(selected)
                    ? ` · ${amountLabel(selected) ?? ""}`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                className="ml-auto rounded-sm p-1 text-fg-2 hover:bg-surface-2 hover:text-fg-0"
                aria-label="关闭"
                onClick={() => setSelected(null)}
                disabled={pending}
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              {error && <Notice tone="warn">{error}</Notice>}
              {selected.type === "title_set" && (
                <Field
                  label="头衔"
                  htmlFor="exchange-title"
                  required
                  hint={`1–${String(selected.params.max_length ?? 32)} 字，不能含 emoji`}
                >
                  <Input
                    id="exchange-title"
                    value={title}
                    maxLength={Number(selected.params.max_length ?? 32)}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </Field>
              )}
              {selected.type === "gift_bonus" && (
                <>
                  <Field label="接收者用户名" htmlFor="exchange-recipient" required>
                    <Input
                      id="exchange-recipient"
                      value={recipient}
                      autoCapitalize="none"
                      spellCheck={false}
                      onChange={(event) => setRecipient(event.target.value)}
                    />
                  </Field>
                  <Field label="留言（可选）" htmlFor="exchange-message">
                    <Textarea
                      id="exchange-message"
                      value={message}
                      rows={3}
                      onChange={(event) => setMessage(event.target.value)}
                    />
                  </Field>
                </>
              )}
              {selected.type === "username_change" && (
                <Field label="新用户名" htmlFor="exchange-username" required hint="3–32 位小写 ASCII；冷却期内只能改回旧名">
                  <Input
                    id="exchange-username"
                    value={username}
                    autoCapitalize="none"
                    spellCheck={false}
                    onChange={(event) => setUsername(event.target.value)}
                  />
                </Field>
              )}
              {(selected.type === "download_add" || selected.type === "upload_sell") && (
                <Notice tone="warn">该操作会改变分享率，可能影响等级。</Notice>
              )}
              {selected.type === "hnr_clear" && (
                <Notice tone="info">
                  购买后获得清除机会，请到个人页 H&R 列表逐条清除。
                </Notice>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="default" onClick={() => setSelected(null)} disabled={pending}>
                取消
              </Button>
              <Button variant="primary" onClick={() => void confirm()} disabled={pending}>
                {pending ? "处理中…" : "确认"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
