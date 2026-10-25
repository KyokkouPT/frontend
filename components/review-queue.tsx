"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReviewReason, TorrentDetail } from "@kyokkou/contracts";
import { ApiClientError, apiPost } from "@/lib/api/client";
import { formatBytes, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { EmptyState } from "./ui/empty-state";
import { Field, Select, Textarea } from "./ui/field";
import { Notice } from "./notice";
import { Panel } from "./ui/panel";

const ACTION_LABEL = {
  approve: "已通过并公开",
  reject: "已驳回并通知发布者",
  return: "已退回并通知发布者",
} as const;

export function ReviewQueue({
  initial,
  reasons,
}: {
  initial: TorrentDetail[];
  reasons: ReviewReason[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [selectedId, setSelectedId] = useState<number | null>(initial[0]?.id ?? null);
  const [reasonKey, setReasonKey] = useState(reasons[0]?.key ?? "naming");
  const [reason, setReason] = useState(reasons[0]?.detail ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const selected = items.find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    if (!selected && items.length > 0) setSelectedId(items[0]?.id ?? null);
  }, [items, selected]);

  async function act(action: "approve" | "reject" | "return") {
    if (!selected) return;
    setPending(true);
    setError(null);
    setNotice(null);

    try {
      await apiPost(`/api/v1/staff/review/${String(selected.id)}/${action}`, action === "approve" ? {} : { reason });
      setItems((previous) => previous.filter((item) => item.id !== selected.id));
      setNotice(ACTION_LABEL[action]);
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof ApiClientError ? actionError.message : "操作失败，请稍后重试");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
      <Panel title="待审队列" description={`${String(items.length)} 个种子`}>
        {items.length === 0 ? (
          <EmptyState title="队列已清空" description="当前没有等待审核的种子。" />
        ) : (
          <ul className="grid gap-0.5">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  aria-current={item.id === selectedId ? "true" : undefined}
                  className={cn(
                    "w-full rounded-sm px-2 py-2 text-left transition-colors",
                    item.id === selectedId
                      ? "bg-accent/12 text-accent"
                      : "text-fg-1 hover:bg-surface-2 hover:text-fg-0",
                  )}
                >
                  <span className="block truncate text-[13px] font-medium">{item.name}</span>
                  <span className="mt-0.5 block text-2xs text-fg-2">
                    {item.section.name} · {item.uploader?.name ?? "未知"} ·{" "}
                    {formatRelativeTime(item.created_at)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="grid min-w-0 gap-4">
        {notice && <Notice tone="info">{notice}</Notice>}
        {error && <Notice tone="warn">{error}</Notice>}

        {selected ? (
          <>
            <Panel
              title={selected.name}
              description={`${selected.section.name} · ${selected.category.name} · ${formatBytes(selected.size)}`}
            >
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <Row label="发布者" value={selected.uploader?.name ?? "未知"} />
                <Row label="大小" value={formatBytes(selected.size)} />
                <Row label="文件数" value={String(selected.files_count)} />
                <Row label="Info hash" value={selected.info_hash} mono />
              </dl>

              {Object.keys(selected.meta).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">
                  {Object.entries(selected.meta).map(([key, value]) => (
                    <Badge key={key} tone="default">
                      {key}: {String(value)}
                    </Badge>
                  ))}
                </div>
              )}

              {selected.description && (
                <p className="mt-3 border-t border-line pt-3 text-sm leading-relaxed whitespace-pre-wrap">
                  {selected.description}
                </p>
              )}

              {selected.files.length > 0 && (
                <div className="mt-3 overflow-x-auto border-t border-line pt-2">
                  <table className="w-full min-w-[420px] text-left text-xs">
                    <tbody>
                      {selected.files.map((file) => (
                        <tr key={file.path} className="border-b border-line/60 last:border-0">
                          <td className="max-w-[440px] truncate py-1.5 pr-3 font-mono">{file.path}</td>
                          <td className="py-1.5 text-right font-mono">{formatBytes(file.size)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>

            <Panel title="审核动作" description="驳回与退回必须填写理由，发布者会收到通知">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="primary" onClick={() => void act("approve")} disabled={pending}>
                  通过并公开
                </Button>
                <Button variant="default" onClick={() => void act("return")} disabled={pending}>
                  退回修改
                </Button>
                <Button
                  variant="default"
                  className="border-danger/40 text-danger hover:bg-danger/10"
                  onClick={() => void act("reject")}
                  disabled={pending}
                >
                  驳回
                </Button>
              </div>

              <div className="mt-3 grid gap-3">
                <Field label="驳回模板" htmlFor="review-reason-key">
                  <Select
                    id="review-reason-key"
                    value={reasonKey}
                    onChange={(event) => {
                      setReasonKey(event.target.value);
                      setReason(reasons.find((item) => item.key === event.target.value)?.detail ?? "");
                    }}
                  >
                    {reasons.map((item) => (
                      <option key={item.key} value={item.key}>
                        {item.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="理由（驳回/退回必填）" htmlFor="review-reason">
                  <Textarea
                    id="review-reason"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="说明需要修改的地方"
                  />
                </Field>
              </div>
            </Panel>
          </>
        ) : (
          <EmptyState title="选择左侧的种子" description="队列中的种子会显示详情与审核动作。" />
        )}
      </div>
    </div>
  );
}

function Row({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline gap-3">
      <dt className="text-xs text-fg-2">{label}</dt>
      <dd className={cn("ml-auto truncate text-[13px]", mono && "font-mono")}>{value}</dd>
    </div>
  );
}
