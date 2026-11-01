"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ClassNotificationTemplates, ClassRulesSettings } from "@kyokkou/contracts";
import { ApiClientError, apiFetch } from "@/lib/api/client";
import { Button } from "./ui/button";
import { Field, Input, Select, Textarea } from "./ui/field";
import { Notice } from "./notice";
import { Panel } from "./ui/panel";

type MatrixRow = { download_gb: number; min_ratio: number; id: number };
let nextRowId = 1;

export function ClassRulesForm({
  initialRules,
  initialTemplates,
  classes,
}: {
  initialRules: ClassRulesSettings;
  initialTemplates: ClassNotificationTemplates;
  classes: { slug: string; name: string; rank: number }[];
}) {
  const router = useRouter();
  const [matrixEnabled, setMatrixEnabled] = useState(initialRules.matrix_enabled);
  const [matrixTarget, setMatrixTarget] = useState(initialRules.matrix_target_slug);
  const [rows, setRows] = useState<MatrixRow[]>(() =>
    initialRules.ratio_matrix.map((row) => ({ ...row, id: nextRowId++ })),
  );
  const [templates, setTemplates] = useState(initialTemplates);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function saveAll(): Promise<void> {
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      await apiFetch("/api/v1/staff/classes/rules", {
        method: "PUT",
        body: JSON.stringify({
          matrix_enabled: matrixEnabled,
          matrix_target_slug: matrixTarget,
          ratio_matrix: rows
            .map(({ download_gb, min_ratio }) => ({ download_gb: Number(download_gb), min_ratio: Number(min_ratio) }))
            .sort((a, b) => a.download_gb - b.download_gb),
        }),
      });
      await apiFetch("/api/v1/staff/classes/notifications", {
        method: "PUT",
        body: JSON.stringify(templates),
      });
      setMessage("已保存规则与通知模板");
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

      <Panel title="分享率矩阵" description="下载量达到下限而分享率低于阈值时，按等级缓冲降入受限等级">
        <div className="grid gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={matrixEnabled}
              onChange={(event) => setMatrixEnabled(event.target.checked)}
            />
            启用分享率矩阵
          </label>
          <Field
            label="矩阵降级目标等级"
            htmlFor="matrix-target"
            hint="命中矩阵后统一降入该等级；目标等级需低于当前等级才会生效"
          >
            <Select
              id="matrix-target"
              value={matrixTarget}
              onChange={(event) => setMatrixTarget(event.target.value)}
            >
              {classes.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}（{item.slug}，rank {item.rank}）
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-2">
            {rows.map((row) => (
              <div key={row.id} className="flex flex-wrap items-end gap-2 rounded-sm border border-line bg-surface-2 p-2">
                <Field label="下载量 ≥（GB）" htmlFor={`m-${String(row.id)}-gb`} className="w-40">
                  <Input
                    id={`m-${String(row.id)}-gb`}
                    type="number"
                    min={0}
                    value={row.download_gb}
                    onChange={(event) =>
                      setRows((previous) =>
                        previous.map((entry) =>
                          entry.id === row.id ? { ...entry, download_gb: Number(event.target.value) } : entry,
                        ),
                      )
                    }
                  />
                </Field>
                <Field label="最低分享率" htmlFor={`m-${String(row.id)}-ratio`} className="w-40">
                  <Input
                    id={`m-${String(row.id)}-ratio`}
                    type="number"
                    step="any"
                    min={0}
                    value={row.min_ratio}
                    onChange={(event) =>
                      setRows((previous) =>
                        previous.map((entry) =>
                          entry.id === row.id ? { ...entry, min_ratio: Number(event.target.value) } : entry,
                        ),
                      )
                    }
                  />
                </Field>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9"
                  onClick={() => setRows((previous) => previous.filter((entry) => entry.id !== row.id))}
                >
                  删除
                </Button>
              </div>
            ))}
          </div>
          <div>
            <Button
              type="button"
              variant="default"
              onClick={() =>
                setRows((previous) => [...previous, { id: nextRowId++, download_gb: 50, min_ratio: 0.4 }])
              }
            >
              添加矩阵行
            </Button>
          </div>
        </div>
      </Panel>

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
          {pending ? "保存中…" : "保存规则与模板"}
        </Button>
      </div>
    </div>
  );
}
