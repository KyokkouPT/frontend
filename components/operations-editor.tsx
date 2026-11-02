"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { StaffOperationsResponse, StaffOperationsSettings } from "@kyokkou/contracts";
import { ApiClientError, apiFetch } from "@/lib/api/client";
import { Button } from "./ui/button";
import { Field, Input } from "./ui/field";
import { Notice } from "./notice";
import { Panel } from "./ui/panel";

function errorText(error: unknown, fallback: string): string {
  return error instanceof ApiClientError ? (error.fields?.[0]?.message ?? error.message) : fallback;
}

export function OperationsEditor({ initial }: { initial: StaffOperationsSettings }) {
  const router = useRouter();
  const [settings, setSettings] = useState(initial);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function patchEconomy(values: Partial<StaffOperationsSettings["economy"]>): void {
    setSettings((previous) => ({ ...previous, economy: { ...previous.economy, ...values } }));
  }

  function patchShop(values: Partial<StaffOperationsSettings["shop"]>): void {
    setSettings((previous) => ({ ...previous, shop: { ...previous.shop, ...values } }));
  }

  async function save(): Promise<void> {
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const result = await apiFetch<StaffOperationsResponse>("/api/v1/staff/operations", {
        method: "PUT",
        body: JSON.stringify({ economy: settings.economy, shop: settings.shop }),
      });
      setSettings(result.settings);
      setMessage("经济与商店设置已保存");
      router.refresh();
    } catch (caught) {
      setError(errorText(caught, "保存失败"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6">
      {error && <Notice tone="warn">{error}</Notice>}
      {message && <Notice tone="info">{message}</Notice>}

      <Panel title="经济" description="魔力值、兑换与求种悬赏开关">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.economy.bonus_enabled}
              onChange={(event) => patchEconomy({ bonus_enabled: event.target.checked })}
              className="size-[15px] accent-accent"
            />
            启用魔力值
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.economy.exchange_enabled}
              onChange={(event) => patchEconomy({ exchange_enabled: event.target.checked })}
              className="size-[15px] accent-accent"
            />
            启用兑换
          </label>
          <Field label="求种悬赏下限" htmlFor="economy-min">
            <Input
              id="economy-min"
              type="number"
              value={String(settings.economy.request_min_bounty)}
              onChange={(event) =>
                patchEconomy({ request_min_bounty: Number(event.target.value) })
              }
            />
          </Field>
          <Field label="求种悬赏上限" htmlFor="economy-max">
            <Input
              id="economy-max"
              type="number"
              value={String(settings.economy.request_max_bounty)}
              onChange={(event) =>
                patchEconomy({ request_max_bounty: Number(event.target.value) })
              }
            />
          </Field>
        </div>
      </Panel>

      <Panel title="魔力值商店设置" description="用户名规则、送礼上限与 H&R 机会有效期">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="改名冷却（天）" htmlFor="shop-cooldown">
            <Input
              id="shop-cooldown"
              type="number"
              min="0"
              value={String(settings.shop.rename_cooldown_days)}
              onChange={(event) =>
                patchShop({ rename_cooldown_days: Number(event.target.value) })
              }
            />
          </Field>
          <Field label="旧名保留（天）" htmlFor="shop-reserve">
            <Input
              id="shop-reserve"
              type="number"
              min="0"
              value={String(settings.shop.username_reserve_days)}
              onChange={(event) =>
                patchShop({ username_reserve_days: Number(event.target.value) })
              }
            />
          </Field>
          <Field label="回退退款比例" htmlFor="shop-refund" hint="0–1，默认 1 全额">
            <Input
              id="shop-refund"
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={String(settings.shop.rename_refund_ratio)}
              onChange={(event) =>
                patchShop({ rename_refund_ratio: Number(event.target.value) })
              }
            />
          </Field>
          <Field label="单次送礼上限" htmlFor="shop-gift-max" hint="-1 表示不限">
            <Input
              id="shop-gift-max"
              type="number"
              min="-1"
              value={String(settings.shop.gift_max_per_transaction)}
              onChange={(event) =>
                patchShop({ gift_max_per_transaction: Number(event.target.value) })
              }
            />
          </Field>
          <Field label="送礼留言最大长度" htmlFor="shop-gift-message">
            <Input
              id="shop-gift-message"
              type="number"
              min="0"
              value={String(settings.shop.gift_message_max_length)}
              onChange={(event) =>
                patchShop({ gift_message_max_length: Number(event.target.value) })
              }
            />
          </Field>
          <Field label="H&R 机会有效期（天）" htmlFor="shop-hnr-expire" hint="-1 表示永久">
            <Input
              id="shop-hnr-expire"
              type="number"
              min="-1"
              value={String(settings.shop.hnr_credit_expire_days)}
              onChange={(event) =>
                patchShop({ hnr_credit_expire_days: Number(event.target.value) })
              }
            />
          </Field>
        </div>
        <div className="mt-4">
          <Button variant="primary" onClick={() => void save()} disabled={pending}>
            {pending ? "保存中…" : "保存经济与商店设置"}
          </Button>
        </div>
      </Panel>
    </div>
  );
}
