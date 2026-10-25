"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ExchangeItem, ExchangeResponse } from "@kyokkou/contracts";
import { ApiClientError, apiPost } from "@/lib/api/client";
import { formatNumber } from "@/lib/format";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Notice } from "./notice";

export function ExchangeList({
  items,
  frozen,
  balance,
}: {
  items: ExchangeItem[];
  frozen: boolean;
  balance: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function exchange(item: ExchangeItem) {
    setPending(item.key);
    setError(null);
    setMessage(null);

    try {
      const idempotencyKey = `${item.key}-${crypto.randomUUID()}`;
      const result = await apiPost<ExchangeResponse>(
        `/api/v1/me/exchange/${encodeURIComponent(item.key)}`,
        {},
        { idempotencyKey },
      );
      setMessage(result.message);
      router.refresh();
    } catch (exchangeError) {
      setError(
        exchangeError instanceof ApiClientError ? exchangeError.message : "兑换失败，请稍后重试",
      );
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="grid gap-3">
      {message && <Notice tone="info">{message}</Notice>}
      {error && <Notice tone="warn">{error}</Notice>}
      {frozen && <Notice tone="warn">收益冻结期间不能兑换。</Notice>}

      {items.length === 0 ? (
        <p className="text-sm text-fg-2">当前没有可用兑换项。</p>
      ) : (
        <ul className="grid gap-2">
          {items.map((item) => {
            const affordable = balance >= item.price;
            return (
              <li
                key={item.key}
                className="flex flex-wrap items-center gap-3 rounded-md border border-line bg-surface-1 p-3"
              >
                <div className="min-w-0">
                  <b className="text-sm font-semibold">{item.name}</b>
                  <p className="mt-0.5 text-xs text-fg-2">{item.description ?? ""}</p>
                </div>
                <Badge tone="accent" mono className="ml-auto">
                  {formatNumber(item.price)}
                </Badge>
                <Button
                  variant="primary"
                  disabled={frozen || pending !== null || !affordable}
                  onClick={() => void exchange(item)}
                >
                  {pending === item.key ? "兑换中…" : affordable ? "兑换" : "余额不足"}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
