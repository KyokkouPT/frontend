"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ClassNotificationTemplates } from "@kyokkou/contracts";
import { ApiClientError, apiFetch } from "@/lib/api/client";
import { Button } from "./ui/button";
import { Field, Textarea } from "./ui/field";
import { Notice } from "./notice";
import { Panel } from "./ui/panel";

export function ClassRulesForm({
  initialTemplates,
}: {
  initialTemplates: ClassNotificationTemplates;
}) {
  const router = useRouter();
  const [templates, setTemplates] = useState(initialTemplates);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function saveAll(): Promise<void> {
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      await apiFetch("/api/v1/staff/classes/notifications", {
        method: "PUT",
        body: JSON.stringify(templates),
      });
      setMessage("已保存通知模板");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "保存失败");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6">
      {error && <Notice tone="warn">{error}</Notice>}
      {message && <Notice tone="info">{message}</Notice>}

      <Panel title="升降通知模板" description="占位符：{username} {old_class} {new_class} {reason} {site_name} {date}">
        <div className="grid gap-3">
          <Field label="升级" htmlFor="tpl-promote">
            <Textarea
              id="tpl-promote"
              value={templates.promote}
              rows={3}
              onChange={(event) => setTemplates((previous) => ({ ...previous, promote: event.target.value }))}
            />
          </Field>
          <Field label="降级" htmlFor="tpl-demote">
            <Textarea
              id="tpl-demote"
              value={templates.demote}
              rows={3}
              onChange={(event) => setTemplates((previous) => ({ ...previous, demote: event.target.value }))}
            />
          </Field>
          <Field label="降级预告" htmlFor="tpl-warning">
            <Textarea
              id="tpl-warning"
              value={templates.demote_warning}
              rows={3}
              onChange={(event) =>
                setTemplates((previous) => ({ ...previous, demote_warning: event.target.value }))
              }
            />
          </Field>
        </div>
      </Panel>

      <div className="flex items-center gap-2">
        <Button type="button" variant="primary" disabled={pending} onClick={() => void saveAll()}>
          {pending ? "保存中…" : "保存通知模板"}
        </Button>
      </div>
    </div>
  );
}
