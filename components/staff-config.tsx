"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { StaffSectionItem, StaffSettings, StaffSettingsResponse } from "@kyokkou/contracts";
import { ApiClientError, apiFetch } from "@/lib/api/client";
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
          <Field label="关闭注册时的提示" htmlFor="registration-closed">
            <Textarea
              id="registration-closed"
              value={settings.registration.closed_message}
              onChange={(event) => patch("registration", { closed_message: event.target.value })}
            />
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

  function update(slug: string, values: Partial<StaffSectionItem>) {
    setItems((previous) =>
      previous.map((section) => (section.slug === slug ? { ...section, ...values } : section)),
    );
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
