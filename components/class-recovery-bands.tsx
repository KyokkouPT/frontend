"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ClassRecoveryBand, ClassRecoveryBandsResponse } from "@kyokkou/contracts";
import { ApiClientError, apiFetch } from "@/lib/api/client";
import { Button } from "./ui/button";
import { Field, Input } from "./ui/field";
import { Notice } from "./notice";
import { Panel } from "./ui/panel";

const GB = 1024 ** 3;

type Row = {
  id: number;
  minGb: string;
  maxGb: string;
  ratio: string;
  order: string;
};

function toRow(item: ClassRecoveryBand, index: number): Row {
  return {
    id: index + 1,
    minGb: String(item.min_download_bytes / GB),
    maxGb: item.max_download_bytes === null ? "" : String(item.max_download_bytes / GB),
    ratio: String(item.min_ratio),
    order: String(item.display_order),
  };
}

export function ClassRecoveryBandsPanel({ initial }: { initial: ClassRecoveryBand[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(initial.map(toRow));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function update(id: number, patch: Partial<Row>): void {
    setRows((previous) => previous.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  async function save(): Promise<void> {
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const result = await apiFetch<ClassRecoveryBandsResponse>(
        "/api/v1/staff/classes/recovery-bands",
        {
          method: "PUT",
          body: JSON.stringify({
            items: rows.map((row) => ({
              min_download_bytes: Number(row.minGb) * GB,
              max_download_bytes: row.maxGb.trim() === "" ? null : Number(row.maxGb) * GB,
              min_ratio: Number(row.ratio),
              display_order: Number(row.order),
            })),
          }),
        },
      );
      setRows(result.items.map(toRow));
      setMessage("受限恢复分段已保存");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "保存失败");
    } finally {
      setPending(false);
    }
  }

  return (
    <Panel
      title="受限恢复分段"
      description="按下载量匹配分段，达到对应分享率即从“受限”恢复为“新用户”。可增删分段。"
    >
      {error && <Notice tone="warn">{error}</Notice>}
      {message && <Notice tone="info">{message}</Notice>}
      <div className="mt-3 grid gap-3">
        {rows.map((row) => (
          <div key={row.id} className="grid gap-2 rounded-md border border-line p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
            <Field label="下载量下限（GB）" htmlFor={`band-min-${String(row.id)}`}>
              <Input
                id={`band-min-${String(row.id)}`}
                type="number"
                min="0"
                value={row.minGb}
                onChange={(event) => update(row.id, { minGb: event.target.value })}
              />
            </Field>
            <Field label="下载量上限（GB，空=不限）" htmlFor={`band-max-${String(row.id)}`}>
              <Input
                id={`band-max-${String(row.id)}`}
                type="number"
                min="0"
                value={row.maxGb}
                onChange={(event) => update(row.id, { maxGb: event.target.value })}
              />
            </Field>
            <Field label="最低分享率" htmlFor={`band-ratio-${String(row.id)}`}>
              <Input
                id={`band-ratio-${String(row.id)}`}
                type="number"
                min="0"
                step="0.01"
                value={row.ratio}
                onChange={(event) => update(row.id, { ratio: event.target.value })}
              />
            </Field>
            <div className="flex items-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setRows((previous) => previous.filter((item) => item.id !== row.id))}
              >
                删除
              </Button>
            </div>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="default"
            onClick={() =>
              setRows((previous) => [
                ...previous,
                {
                  id: Math.max(0, ...previous.map((row) => row.id)) + 1,
                  minGb: "0",
                  maxGb: "",
                  ratio: "0.4",
                  order: String((previous.length + 1) * 10),
                },
              ])
            }
          >
            添加分段
          </Button>
          <Button type="button" variant="primary" onClick={() => void save()} disabled={pending}>
            {pending ? "保存中…" : "保存恢复分段"}
          </Button>
        </div>
      </div>
    </Panel>
  );
}
