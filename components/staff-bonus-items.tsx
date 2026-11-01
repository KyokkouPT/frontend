"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import type { ExchangeType, StaffExchangeItem } from "@kyokkou/contracts";
import { ApiClientError, apiFetch, apiPost } from "@/lib/api/client";
import { formatBonus, formatBytes } from "@/lib/format";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Field, Input, Select, Textarea } from "./ui/field";
import { Notice } from "./notice";
import { Panel } from "./ui/panel";

const GB = 1024 ** 3;

const TYPE_OPTIONS: { value: ExchangeType; label: string; direction: "buy" | "sell" }[] = [
  { value: "upload_add", label: "增加上传量", direction: "buy" },
  { value: "download_add", label: "增加下载量", direction: "buy" },
  { value: "download_reduce", label: "减免下载量", direction: "buy" },
  { value: "invite_add", label: "增加邀请名额", direction: "buy" },
  { value: "title_set", label: "自定义头衔", direction: "buy" },
  { value: "gift_bonus", label: "赠送魔力值", direction: "buy" },
  { value: "username_change", label: "修改用户名", direction: "buy" },
  { value: "hnr_clear", label: "H&R 清除机会", direction: "buy" },
  { value: "invite_sell", label: "出售邀请名额", direction: "sell" },
  { value: "upload_sell", label: "出售上传量", direction: "sell" },
];

const TRAFFIC = new Set<ExchangeType>(["upload_add", "download_add", "download_reduce", "upload_sell"]);

type FormState = {
  key: string;
  name: string;
  description: string;
  type: ExchangeType;
  amount: string;
  price: string;
  maxLength: string;
  feeRatio: string;
  inventory: string;
  limit: string;
  minRank: string;
  displayOrder: string;
  enabled: boolean;
};

function blankForm(): FormState {
  return {
    key: "",
    name: "",
    description: "",
    type: "upload_add",
    amount: "10",
    price: "1000",
    maxLength: "32",
    feeRatio: "0",
    inventory: "",
    limit: "",
    minRank: "",
    displayOrder: "0",
    enabled: true,
  };
}

function formFromItem(item: StaffExchangeItem): FormState {
  const type = item.type as ExchangeType;
  return {
    key: item.key,
    name: item.name,
    description: item.description ?? "",
    type,
    amount:
      item.amount === null
        ? ""
        : TRAFFIC.has(type)
          ? String(Math.round((item.amount / GB) * 100) / 100)
          : String(item.amount),
    price: String(item.price),
    maxLength: String(item.params.max_length ?? 32),
    feeRatio: String(item.params.fee_ratio ?? 0),
    inventory: item.inventory === null ? "" : String(item.inventory),
    limit: item.limit_per_user === null ? "" : String(item.limit_per_user),
    minRank: item.min_class_rank === null ? "" : String(item.min_class_rank),
    displayOrder: String(item.display_order),
    enabled: item.enabled,
  };
}

function errorText(error: unknown): string {
  return error instanceof ApiClientError ? (error.fields?.[0]?.message ?? error.message) : "操作失败";
}

export function StaffBonusItems({ initial }: { initial: StaffExchangeItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [form, setForm] = useState<FormState | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typeMeta = useMemo(
    () => TYPE_OPTIONS.find((item) => item.value === form?.type) ?? TYPE_OPTIONS[0],
    [form?.type],
  );
  const isTraffic = form ? TRAFFIC.has(form.type) : false;
  const isGift = form?.type === "gift_bonus";
  const isTitle = form?.type === "title_set";
  const needsAmount = form
    ? form.type !== "title_set" && form.type !== "username_change"
    : false;
  const computedGiftPrice = isGift
    ? Math.floor(Number(form?.amount ?? 0) * (1 + Number(form?.feeRatio ?? 0)))
    : 0;

  function patch(next: Partial<FormState>): void {
    setForm((current) => (current ? { ...current, ...next } : current));
  }

  function openCreate(): void {
    setEditingId(null);
    setForm(blankForm());
    setError(null);
  }

  function openEdit(item: StaffExchangeItem): void {
    setEditingId(item.id);
    setForm(formFromItem(item));
    setError(null);
  }

  function bodyFromForm(current: FormState): Record<string, unknown> {
    const meta = TYPE_OPTIONS.find((item) => item.value === current.type) ?? TYPE_OPTIONS[0];
    let amount: number | null = null;
    if (current.type === "invite_add" || current.type === "invite_sell") amount = 1;
    else if (isTraffic) {
      const gb = Number(current.amount);
      amount = Number.isFinite(gb) && gb > 0 ? Math.floor(gb * GB) : null;
    } else if (current.type === "gift_bonus" || current.type === "hnr_clear") {
      const parsed = Number(current.amount);
      amount = Number.isFinite(parsed) ? Math.floor(parsed) : null;
    }
    const params: Record<string, unknown> = {};
    if (current.type === "title_set") params.max_length = Number(current.maxLength);
    if (current.type === "gift_bonus") params.fee_ratio = Number(current.feeRatio);
    const price =
      current.type === "gift_bonus"
        ? Math.floor(Number(amount ?? 0) * (1 + Number(current.feeRatio)))
        : Number(current.price);
    return {
      ...(editingId === null ? { key: current.key.trim() } : {}),
      name: current.name.trim(),
      description: current.description.trim() || null,
      direction: meta.direction,
      type: current.type,
      amount,
      price,
      params,
      inventory: current.inventory.trim() ? Number(current.inventory) : null,
      limit_per_user: current.limit.trim() ? Number(current.limit) : null,
      min_class_rank: current.minRank.trim() ? Number(current.minRank) : null,
      display_order: Number(current.displayOrder) || 0,
      enabled: current.enabled,
    };
  }

  async function save(): Promise<void> {
    if (!form) return;
    setPending(true);
    setError(null);
    try {
      const body = bodyFromForm(form);
      if (editingId === null) {
        await apiPost("/api/v1/staff/bonus/items", body);
      } else {
        await apiFetch(`/api/v1/staff/bonus/items/${String(editingId)}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      }
      const refreshed = await apiFetch<{ items: StaffExchangeItem[] }>("/api/v1/staff/bonus/items");
      setItems(refreshed.items);
      setForm(null);
      router.refresh();
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setPending(false);
    }
  }

  async function toggle(item: StaffExchangeItem): Promise<void> {
    setPending(true);
    setError(null);
    try {
      const result = await apiPost<{ enabled: boolean }>(
        `/api/v1/staff/bonus/items/${String(item.id)}/toggle`,
        {},
      );
      setItems((current) =>
        current.map((row) => (row.id === item.id ? { ...row, enabled: result.enabled } : row)),
      );
      router.refresh();
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-4">
      {error && <Notice tone="warn">{error}</Notice>}
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-fg-2">共 {items.length} 个商品；已被兑换过的商品只能停用，不能删除。</p>
        <Button variant="primary" onClick={openCreate}>
          <Plus className="size-4" />
          新建商品
        </Button>
      </div>

      {form && (
        <Panel
          title={editingId === null ? "新建商品" : "编辑商品"}
          description="商品 key 创建后不可修改；类型与方向必须匹配。"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="key" htmlFor="shop-key" required hint="小写字母/数字/下划线，创建后不可修改">
              <Input
                id="shop-key"
                value={form.key}
                disabled={editingId !== null}
                onChange={(event) => patch({ key: event.target.value })}
              />
            </Field>
            <Field label="名称" htmlFor="shop-name" required>
              <Input id="shop-name" value={form.name} onChange={(event) => patch({ name: event.target.value })} />
            </Field>
            <Field label="类型" htmlFor="shop-type">
              <Select
                id="shop-type"
                value={form.type}
                onChange={(event) => {
                  const next = TYPE_OPTIONS.find((item) => item.value === event.target.value);
                  patch({
                    type: (next?.value ?? "upload_add") as ExchangeType,
                    amount: next?.value === "invite_add" || next?.value === "invite_sell" ? "1" : form.amount,
                  });
                }}
              >
                {TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}（{option.direction === "buy" ? "兑换" : "回收"}）
                  </option>
                ))}
              </Select>
            </Field>

            {needsAmount && (
              <Field
                label={isTraffic ? "数量（GB）" : isGift ? "收礼魔力值" : "数量"}
                htmlFor="shop-amount"
                required={form.type !== "invite_add" && form.type !== "invite_sell"}
                hint={form.type === "hnr_clear" ? "一次购买获得的机会数" : undefined}
              >
                <Input
                  id="shop-amount"
                  type="number"
                  min="0"
                  step={isTraffic ? "0.01" : "1"}
                  value={form.type === "invite_add" || form.type === "invite_sell" ? "1" : form.amount}
                  disabled={form.type === "invite_add" || form.type === "invite_sell"}
                  onChange={(event) => patch({ amount: event.target.value })}
                />
              </Field>
            )}

            <Field
              label={isGift ? "自动价格" : "魔力价格"}
              htmlFor="shop-price"
              required
              hint={isGift ? "floor(收礼 × (1 + 手续费))" : undefined}
            >
              <Input
                id="shop-price"
                type="number"
                min="0"
                step="0.01"
                value={isGift ? String(computedGiftPrice) : form.price}
                disabled={isGift}
                onChange={(event) => patch({ price: event.target.value })}
              />
            </Field>

            {isTitle && (
              <Field label="头衔最大长度" htmlFor="shop-max-title">
                <Input
                  id="shop-max-title"
                  type="number"
                  min="1"
                  max="64"
                  value={form.maxLength}
                  onChange={(event) => patch({ maxLength: event.target.value })}
                />
              </Field>
            )}
            {isGift && (
              <Field label="手续费比例" htmlFor="shop-fee">
                <Input
                  id="shop-fee"
                  type="number"
                  min="0"
                  max="10"
                  step="0.01"
                  value={form.feeRatio}
                  onChange={(event) => patch({ feeRatio: event.target.value })}
                />
              </Field>
            )}

            <Field label="总库存（留空不限）" htmlFor="shop-inventory">
              <Input
                id="shop-inventory"
                type="number"
                min="1"
                value={form.inventory}
                onChange={(event) => patch({ inventory: event.target.value })}
              />
            </Field>
            <Field label="个人上限（留空不限）" htmlFor="shop-limit">
              <Input
                id="shop-limit"
                type="number"
                min="1"
                value={form.limit}
                onChange={(event) => patch({ limit: event.target.value })}
              />
            </Field>
            <Field label="最低等级 rank（留空不限）" htmlFor="shop-rank">
              <Input
                id="shop-rank"
                type="number"
                min="0"
                value={form.minRank}
                onChange={(event) => patch({ minRank: event.target.value })}
              />
            </Field>
            <Field label="排序" htmlFor="shop-order">
              <Input
                id="shop-order"
                type="number"
                value={form.displayOrder}
                onChange={(event) => patch({ displayOrder: event.target.value })}
              />
            </Field>
            <Field label="启用" htmlFor="shop-enabled">
              <label className="flex h-10 items-center gap-2 text-sm">
                <input
                  id="shop-enabled"
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(event) => patch({ enabled: event.target.checked })}
                />
                允许用户兑换
              </label>
            </Field>
            <Field label="说明" htmlFor="shop-description" className="sm:col-span-2 lg:col-span-3">
              <Textarea
                id="shop-description"
                value={form.description}
                onChange={(event) => patch({ description: event.target.value })}
              />
            </Field>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="primary" onClick={() => void save()} disabled={pending}>
              {pending ? "保存中…" : "保存"}
            </Button>
            <Button variant="default" onClick={() => setForm(null)} disabled={pending}>
              取消
            </Button>
          </div>
        </Panel>
      )}

      <Panel title="商品列表" flush>
        {items.length === 0 ? (
          <p className="p-4 text-sm text-fg-2">商店为空，点击“新建商品”开始配置。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs text-fg-2">
                  <th className="px-4 py-2.5 font-medium">名称/key</th>
                  <th className="px-3 py-2.5 font-medium">方向/类型</th>
                  <th className="px-3 py-2.5 font-medium">数量</th>
                  <th className="px-3 py-2.5 text-right font-medium">价格</th>
                  <th className="px-3 py-2.5 text-right font-medium">库存</th>
                  <th className="px-3 py-2.5 text-right font-medium">已兑</th>
                  <th className="px-4 py-2.5 font-medium">状态</th>
                  <th className="px-4 py-2.5 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-2.5">
                      <div className="font-medium">{item.name}</div>
                      <div className="font-mono text-2xs text-fg-2">{item.key}</div>
                    </td>
                    <td className="px-3 py-2.5 text-xs">
                      <Badge tone={item.direction === "buy" ? "accent" : "ok"}>{item.direction}</Badge>
                      <div className="mt-1 font-mono text-2xs">{item.type}</div>
                    </td>
                    <td className="px-3 py-2.5 text-xs">
                      {item.amount === null
                        ? "—"
                        : TRAFFIC.has(item.type as ExchangeType)
                          ? formatBytes(item.amount)
                          : String(item.amount)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs">{formatBonus(item.price)}</td>
                    <td className="px-3 py-2.5 text-right text-xs">
                      {item.remaining === null ? "∞" : String(item.remaining)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs">{item.used}</td>
                    <td className="px-4 py-2.5">
                      <Badge tone={item.enabled ? "ok" : "muted"}>
                        {item.enabled ? "启用" : "停用"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end gap-1">
                        <Button variant="default" onClick={() => openEdit(item)}>
                          <Pencil className="size-3.5" />
                          编辑
                        </Button>
                        <Button
                          variant="default"
                          disabled={pending}
                          onClick={() => void toggle(item)}
                        >
                          {item.enabled ? "停用" : "启用"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
