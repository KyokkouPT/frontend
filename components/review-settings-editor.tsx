"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { StaffReviewSettings, StaffReviewSettingsResponse } from "@kyokkou/contracts";
import { ApiClientError, apiFetch } from "@/lib/api/client";
import { Button } from "./ui/button";
import { Field, Input } from "./ui/field";
import { Notice } from "./notice";
import { Panel } from "./ui/panel";

function errorText(error: unknown, fallback: string): string {
  return error instanceof ApiClientError ? (error.fields?.[0]?.message ?? error.message) : fallback;
}

export function ReviewSettingsEditor({ initial }: { initial: StaffReviewSettings }) {
  const router = useRouter();
  const [settings, setSettings] = useState(initial);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(): Promise<void> {
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const result = await apiFetch<StaffReviewSettingsResponse>("/api/v1/staff/review/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      setSettings(result.settings);
      setMessage("审核设置已保存");
      router.refresh();
    } catch (caught) {
      setError(errorText(caught, "保存失败"));
    } finally {
      setPending(false);
    }
  }

  return (
    <Panel title="审核设置" description="自动通过门槛与待审提醒">
      {error && <Notice tone="warn">{error}</Notice>}
      {message && <Notice tone="info">{message}</Notice>}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={settings.auto_approve_trusted}
            onChange={(event) =>
              setSettings((previous) => ({
                ...previous,
                auto_approve_trusted: event.target.checked,
              }))
            }
            className="size-[15px] accent-accent"
          />
          信任用户自动通过
        </label>
        <Field label="信任门槛（已通过数）" htmlFor="review-trusted">
          <Input
            id="review-trusted"
            type="number"
            min={0}
            value={String(settings.trusted_min_approved)}
            onChange={(event) =>
              setSettings((previous) => ({
                ...previous,
                trusted_min_approved: Number(event.target.value),
              }))
            }
          />
        </Field>
        <Field label="待审提醒（小时）" htmlFor="review-pending">
          <Input
            id="review-pending"
            type="number"
            min={0}
            value={String(settings.pending_alert_hours)}
            onChange={(event) =>
              setSettings((previous) => ({
                ...previous,
                pending_alert_hours: Number(event.target.value),
              }))
            }
          />
        </Field>
      </div>
      <div className="mt-4">
        <Button variant="primary" onClick={() => void save()} disabled={pending}>
          {pending ? "保存中…" : "保存审核设置"}
        </Button>
      </div>
    </Panel>
  );
}
