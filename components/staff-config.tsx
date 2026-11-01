"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { StaffSectionItem, StaffSettings, StaffSettingsResponse } from "@kyokkou/contracts";
import { ApiClientError, apiFetch, apiPost } from "@/lib/api/client";
import { Button } from "./ui/button";
import { Field, Input, Select, Textarea } from "./ui/field";
import { Notice } from "./notice";
import { Panel } from "./ui/panel";

function errorText(error: unknown, fallback: string): string {
  return error instanceof ApiClientError ? (error.fields?.[0]?.message ?? error.message) : fallback;
}

export function SettingsEditor({ initial }: { initial: StaffSettings }) {
  const router = useRouter();
  const [settings, setSettings] = useState(initial);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function patch<K extends keyof StaffSettings>(group: K, values: Partial<StaffSettings[K]>) {
    setSettings((previous) => ({ ...previous, [group]: { ...previous[group], ...values } }));
  }

  async function save() {
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const result = await apiFetch<StaffSettingsResponse>("/api/v1/staff/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      setSettings(result.settings);
      setMessage("设置已保存");
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

      <Panel title="站点" description="站点名/副标题/语言；保存后 bootstrap 与页脚同步">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="站点名" htmlFor="site-name">
            <Input
              id="site-name"
              value={settings.site.name}
              onChange={(event) => patch("site", { name: event.target.value })}
            />
          </Field>
          <Field label="副标题" htmlFor="site-tagline">
            <Input
              id="site-tagline"
              value={settings.site.tagline}
              onChange={(event) => patch("site", { tagline: event.target.value })}
            />
          </Field>
          <Field label="语言" htmlFor="site-locale">
            <Input
              id="site-locale"
              value={settings.site.locale}
              onChange={(event) => patch("site", { locale: event.target.value })}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={settings.site.allow_guest_access}
              onChange={(event) =>
                patch("site", { allow_guest_access: event.target.checked })
              }
              className="size-[15px] accent-accent"
            />
            允许未登录用户访问站点页面
          </label>
          <Field
            label="站点规则 / FAQ / 版规（Markdown）"
            htmlFor="site-rules-markdown"
            className="sm:col-span-2"
            hint="显示在 /rules 页面顶部；支持标题、列表、链接、引用、代码块、表格"
          >
            <Textarea
              id="site-rules-markdown"
              value={settings.site.rules_markdown}
              rows={10}
              maxLength={20000}
              onChange={(event) => patch("site", { rules_markdown: event.target.value })}
            />
          </Field>
        </div>
      </Panel>

      <Panel title="注册">
        <div className="grid gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.registration.open}
              onChange={(event) => patch("registration", { open: event.target.checked })}
              className="size-[15px] accent-accent"
            />
            开放注册
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.registration.invite_registration_enabled}
              onChange={(event) =>
                patch("registration", { invite_registration_enabled: event.target.checked })
              }
              className="size-[15px] accent-accent"
            />
            允许邀请码注册
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.registration.invite_require_email}
              onChange={(event) =>
                patch("registration", { invite_require_email: event.target.checked })
              }
              className="size-[15px] accent-accent"
            />
            生成邀请码时要求填写预注册邮箱
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.registration.invite_require_username}
              onChange={(event) =>
                patch("registration", { invite_require_username: event.target.checked })
              }
              className="size-[15px] accent-accent"
            />
            生成邀请码时要求填写预注册用户名
          </label>
          <Field label="关闭注册时的提示" htmlFor="registration-closed" hint="支持 Markdown：标题、列表、链接、引用、代码块、表格">
            <Textarea
              id="registration-closed"
              value={settings.registration.closed_message}
              onChange={(event) => patch("registration", { closed_message: event.target.value })}
            />
          </Field>
          <Field
            label="关闭注册时点击注册"
            htmlFor="registration-closed-mode"
            hint="auto：无邀请码时显示提示，有邀请码时显示表单；form：无邀请码也显示表单；message：无邀请码只显示提示（有邀请码仍显示表单）"
          >
            <Select
              id="registration-closed-mode"
              value={settings.registration.closed_registration_mode}
              onChange={(event) =>
                patch("registration", {
                  closed_registration_mode: event.target.value as "auto" | "form" | "message",
                })
              }
            >
              <option value="auto">自动（按邀请注册设置）</option>
              <option value="form">显示注册表单</option>
              <option value="message">只显示关闭提示</option>
            </Select>
          </Field>
        </div>
      </Panel>

      <Panel title="Tracker">
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["announce_interval", "announce 间隔（秒）"],
              ["min_interval", "最小间隔（秒）"],
              ["peer_ttl", "peer TTL（秒）"],
              ["max_peers", "最大 peers"],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label} htmlFor={`tracker-${key}`}>
              <Input
                id={`tracker-${key}`}
                type="number"
                value={String(settings.tracker[key])}
                onChange={(event) =>
                  patch("tracker", { [key]: Number(event.target.value) } as Partial<StaffSettings["tracker"]>)
                }
              />
            </Field>
          ))}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.tracker.allow_ipv6}
              onChange={(event) => patch("tracker", { allow_ipv6: event.target.checked })}
              className="size-[15px] accent-accent"
            />
            允许 IPv6
          </label>
        </div>
      </Panel>

      <Panel title="经济">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.economy.bonus_enabled}
              onChange={(event) => patch("economy", { bonus_enabled: event.target.checked })}
              className="size-[15px] accent-accent"
            />
            启用魔力值
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.economy.exchange_enabled}
              onChange={(event) => patch("economy", { exchange_enabled: event.target.checked })}
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
                patch("economy", { request_min_bounty: Number(event.target.value) })
              }
            />
          </Field>
          <Field label="求种悬赏上限" htmlFor="economy-max">
            <Input
              id="economy-max"
              type="number"
              value={String(settings.economy.request_max_bounty)}
              onChange={(event) =>
                patch("economy", { request_max_bounty: Number(event.target.value) })
              }
            />
          </Field>
        </div>
      </Panel>

      <Panel title="审核">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.review.auto_approve_trusted}
              onChange={(event) =>
                patch("review", { auto_approve_trusted: event.target.checked })
              }
              className="size-[15px] accent-accent"
            />
            信任用户自动通过
          </label>
          <Field label="信任门槛（已通过数）" htmlFor="review-trusted">
            <Input
              id="review-trusted"
              type="number"
              value={String(settings.review.trusted_min_approved)}
              onChange={(event) =>
                patch("review", { trusted_min_approved: Number(event.target.value) })
              }
            />
          </Field>
          <Field label="待审提醒（小时）" htmlFor="review-pending">
            <Input
              id="review-pending"
              type="number"
              value={String(settings.review.pending_alert_hours)}
              onChange={(event) =>
                patch("review", { pending_alert_hours: Number(event.target.value) })
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
                patch("shop", { rename_cooldown_days: Number(event.target.value) })
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
                patch("shop", { username_reserve_days: Number(event.target.value) })
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
                patch("shop", { rename_refund_ratio: Number(event.target.value) })
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
                patch("shop", { gift_max_per_transaction: Number(event.target.value) })
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
                patch("shop", { gift_message_max_length: Number(event.target.value) })
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
                patch("shop", { hnr_credit_expire_days: Number(event.target.value) })
              }
            />
          </Field>
        </div>
      </Panel>

      <div>
        <Button variant="primary" onClick={() => void save()} disabled={pending}>
          {pending ? "保存中…" : "保存全部设置"}
        </Button>
      </div>
    </div>
  );
}

export function SectionEditor({ initial }: { initial: StaffSectionItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newSlug, setNewSlug] = useState("");
  const [newName, setNewName] = useState("");
  const [newMode, setNewMode] = useState("pre");
  const [newOrder, setNewOrder] = useState("0");
  const [newCharter, setNewCharter] = useState("");
  const [categoryInputs, setCategoryInputs] = useState<Record<string, { slug: string; name: string }>>(
    {},
  );

  function update(slug: string, values: Partial<StaffSectionItem>) {
    setItems((previous) =>
      previous.map((section) => (section.slug === slug ? { ...section, ...values } : section)),
    );
  }

  async function createSection() {
    setPending("create-section");
    setError(null);
    setMessage(null);
    try {
      await apiPost("/api/v1/staff/sections", {
        slug: newSlug.trim(),
        name: newName.trim(),
        review_mode: newMode,
        display_order: Number(newOrder) || 0,
        charter: newCharter.trim() || undefined,
      });
      setMessage(`已创建分区「${newName.trim()}」`);
      setNewSlug("");
      setNewName("");
      setNewCharter("");
      router.refresh();
    } catch (caught) {
      setError(errorText(caught, "创建分区失败"));
    } finally {
      setPending(null);
    }
  }

  async function createCategory(section: StaffSectionItem) {
    const input = categoryInputs[section.slug] ?? { slug: "", name: "" };
    if (!input.slug.trim() || !input.name.trim()) {
      setError("请填写分类标识与名称");
      return;
    }

    setPending(`category-${section.slug}`);
    setError(null);
    setMessage(null);
    try {
      await apiPost("/api/v1/staff/categories", {
        section_slug: section.slug,
        slug: input.slug.trim(),
        name: input.name.trim(),
      });
      setMessage(`已为「${section.name}」添加分类「${input.name.trim()}」`);
      setCategoryInputs((previous) => ({
        ...previous,
        [section.slug]: { slug: "", name: "" },
      }));
      router.refresh();
    } catch (caught) {
      setError(errorText(caught, "添加分类失败"));
    } finally {
      setPending(null);
    }
  }

  async function save(section: StaffSectionItem) {
    setPending(section.slug);
    setError(null);
    setMessage(null);
    try {
      await apiFetch(`/api/v1/staff/sections/${encodeURIComponent(section.slug)}`, {
        method: "PUT",
        body: JSON.stringify({
          name: section.name,
          display_order: section.display_order,
          review_mode: section.review_mode,
          charter: section.charter,
        }),
      });
      setMessage(`已保存分区「${section.name}」`);
      router.refresh();
    } catch (caught) {
      setError(errorText(caught, "保存失败"));
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="grid gap-4">
      {error && <Notice tone="warn">{error}</Notice>}
      {message && <Notice tone="info">{message}</Notice>}

      <Panel title="新建分区" description="创建后可继续编辑；分区标识用于 URL，创建后不可修改">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="分区标识（slug）" htmlFor="new-section-slug">
            <Input
              id="new-section-slug"
              value={newSlug}
              onChange={(event) =>
                setNewSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
              }
              placeholder="例如 anime"
            />
          </Field>
          <Field label="名称" htmlFor="new-section-name">
            <Input
              id="new-section-name"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="例如 动画"
            />
          </Field>
          <Field label="审核模式" htmlFor="new-section-mode">
            <Select id="new-section-mode" value={newMode} onChange={(event) => setNewMode(event.target.value)}>
              <option value="pre">pre</option>
              <option value="review">review</option>
              <option value="staff">staff</option>
            </Select>
          </Field>
          <Field label="排序" htmlFor="new-section-order">
            <Input
              id="new-section-order"
              type="number"
              value={newOrder}
              onChange={(event) => setNewOrder(event.target.value)}
            />
          </Field>
          <Field label="公告" htmlFor="new-section-charter">
            <Textarea
              id="new-section-charter"
              value={newCharter}
              onChange={(event) => setNewCharter(event.target.value)}
            />
          </Field>
        </div>
        <div className="mt-3">
          <Button
            variant="primary"
            disabled={pending !== null || !newSlug.trim() || !newName.trim()}
            onClick={() => void createSection()}
          >
            {pending === "create-section" ? "创建中…" : "创建分区"}
          </Button>
        </div>
      </Panel>

      {items.map((section) => (
        <Panel key={section.slug} title={section.name} description={section.slug}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="名称" htmlFor={`section-name-${section.slug}`}>
              <Input
                id={`section-name-${section.slug}`}
                value={section.name}
                onChange={(event) => update(section.slug, { name: event.target.value })}
              />
            </Field>
            <Field label="排序" htmlFor={`section-order-${section.slug}`}>
              <Input
                id={`section-order-${section.slug}`}
                type="number"
                value={String(section.display_order)}
                onChange={(event) =>
                  update(section.slug, { display_order: Number(event.target.value) })
                }
              />
            </Field>
            <Field label="审核模式" htmlFor={`section-mode-${section.slug}`}>
              <Select
                id={`section-mode-${section.slug}`}
                value={section.review_mode}
                onChange={(event) => update(section.slug, { review_mode: event.target.value })}
              >
                <option value="auto">auto</option>
                <option value="review">review</option>
                <option value="staff">staff</option>
              </Select>
            </Field>
            <Field label="公告" htmlFor={`section-charter-${section.slug}`}>
              <Textarea
                id={`section-charter-${section.slug}`}
                value={section.charter}
                onChange={(event) => update(section.slug, { charter: event.target.value })}
              />
            </Field>
          </div>
          {section.categories.length > 0 && (
            <p className="mt-2 text-xs text-fg-2">
              分类：{section.categories.map((category) => category.name).join(" · ")}
            </p>
          )}
          <div className="mt-3 grid gap-2 border-t border-line pt-3">
            <p className="text-xs font-medium text-fg-2">添加分类</p>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                aria-label={`分类标识 ${section.slug}`}
                placeholder="分类标识（slug）"
                value={categoryInputs[section.slug]?.slug ?? ""}
                onChange={(event) =>
                  setCategoryInputs((previous) => ({
                    ...previous,
                    [section.slug]: {
                      ...(previous[section.slug] ?? { name: "" }),
                      slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                    },
                  }))
                }
                className="h-9 w-44"
              />
              <Input
                aria-label={`分类名称 ${section.slug}`}
                placeholder="分类名称"
                value={categoryInputs[section.slug]?.name ?? ""}
                onChange={(event) =>
                  setCategoryInputs((previous) => ({
                    ...previous,
                    [section.slug]: {
                      ...(previous[section.slug] ?? { slug: "" }),
                      name: event.target.value,
                    },
                  }))
                }
                className="h-9 w-44"
              />
              <Button
                variant="default"
                disabled={pending !== null}
                onClick={() => void createCategory(section)}
              >
                添加分类
              </Button>
            </div>
          </div>
          <div className="mt-3">
            <Button
              variant="primary"
              disabled={pending !== null}
              onClick={() => void save(section)}
            >
              {pending === section.slug ? "保存中…" : "保存分区"}
            </Button>
          </div>
        </Panel>
      ))}
    </div>
  );
}
