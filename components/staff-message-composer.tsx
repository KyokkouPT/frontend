"use client";

import { useEffect, useState } from "react";
import type {
  ClassCondition,
  StaffMessageBody,
  StaffMessageJob,
  StaffMessageOptions,
  StaffMessagePreviewResponse,
  StaffMessageSendResponse,
} from "@kyokkou/contracts";
import { ApiClientError, apiFetch, apiPost } from "@/lib/api/client";
import { Button } from "./ui/button";
import { Field, Input, Select, Textarea } from "./ui/field";
import { Notice } from "./notice";
import { Panel } from "./ui/panel";

const METRICS = [
  { value: "age_days", label: "注册天数" },
  { value: "uploaded", label: "上传量" },
  { value: "downloaded", label: "下载量" },
  { value: "ratio", label: "分享率" },
  { value: "seedtime_hours", label: "做种时长（小时）" },
  { value: "bonus", label: "魔力值" },
  { value: "torrents_published", label: "发布数" },
  { value: "invites_used", label: "已用邀请" },
  { value: "warnings", label: "警告次数" },
  { value: "hnr_unfinished", label: "未完成 H&R" },
  { value: "last_active_days", label: "最近活跃（天）" },
] as const;

const OPS = [">=", ">", "<=", "<", "==", "!="] as const;

type ConditionRow = {
  id: number;
  metric: string;
  op: ClassCondition["op"];
  value: number;
  unit: ClassCondition["unit"];
};

function parseUserIds(text: string): number[] | null {
  const parts = text.split(/[\s,;，；]+/).filter(Boolean);
  const ids: number[] = [];
  for (const part of parts) {
    const value = Number(part);
    if (!Number.isInteger(value) || value <= 0) return null;
    ids.push(value);
  }
  return [...new Set(ids)];
}

export function StaffMessageComposer({ classes }: { classes: StaffMessageOptions["classes"] }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [logic, setLogic] = useState<"all" | "any">("all");
  const [rows, setRows] = useState<ConditionRow[]>([]);
  const [classSlugs, setClassSlugs] = useState<string[]>([]);
  const [userIdsText, setUserIdsText] = useState("");
  const [pending, setPending] = useState(false);
  const [preview, setPreview] = useState<StaffMessagePreviewResponse | null>(null);
  const [jobToken, setJobToken] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<StaffMessageJob["status"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("kp:mass-message-job");
    if (saved) {
      setJobToken(saved);
      setJobStatus("queued");
    }
  }, []);

  useEffect(() => {
    if (!jobToken || jobStatus === "completed" || jobStatus === "failed") return;
    let cancelled = false;

    async function poll(): Promise<void> {
      try {
        const job = await apiFetch<StaffMessageJob>(
          `/api/v1/staff/messages/jobs/${encodeURIComponent(jobToken as string)}`,
        );
        if (cancelled) return;
        setJobStatus(job.status);
        if (job.status === "completed") {
          setMessage(`已完成，已向 ${String(job.recipients)} 名用户发送站内信。`);
          setPreview(null);
          window.localStorage.removeItem("kp:mass-message-job");
        } else if (job.status === "failed") {
          setError(job.error ?? "发送失败，请稍后重试");
          window.localStorage.removeItem("kp:mass-message-job");
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof ApiClientError ? caught.message : "查询发送状态失败");
          setJobStatus("failed");
          window.localStorage.removeItem("kp:mass-message-job");
        }
      }
    }

    void poll();
    const timer = setInterval(() => void poll(), 1500);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [jobToken, jobStatus]);

  const jobRunning = jobStatus === "queued" || jobStatus === "running";

  function addCondition(): void {
    const nextId = rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
    setRows((previous) => [
      ...previous,
      { id: nextId, metric: "age_days", op: ">=", value: 0, unit: "GB" },
    ]);
  }

  function updateCondition(id: number, patch: Partial<ConditionRow>): void {
    setRows((previous) => previous.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function buildBody(): StaffMessageBody | null {
    const userIds = parseUserIds(userIdsText);
    if (userIds === null) {
      setError("用户 ID 必须是逗号或空格分隔的正整数");
      return null;
    }
    const conditions = rows.map((row) => ({
      metric: row.metric,
      op: row.op,
      value: Number(row.value),
      ...(row.metric === "uploaded" || row.metric === "downloaded"
        ? { unit: row.unit ?? "GB" }
        : {}),
    }));
    return {
      title: title.trim(),
      body: body.trim(),
      ...(linkUrl.trim() ? { link_url: linkUrl.trim() } : {}),
      ...(conditions.length > 0 ? { conditions: { logic, conditions } } : {}),
      ...(classSlugs.length > 0 ? { class_slugs: classSlugs } : {}),
      ...(userIds.length > 0 ? { user_ids: userIds } : {}),
    };
  }

  async function runPreview(): Promise<void> {
    const payload = buildBody();
    if (!payload) return;
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      setPreview(await apiPost<StaffMessagePreviewResponse>("/api/v1/staff/messages/preview", payload));
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "预览失败，请稍后重试");
    } finally {
      setPending(false);
    }
  }

  async function send(): Promise<void> {
    const payload = buildBody();
    if (!payload) return;
    if (!window.confirm("确认向符合条件的用户发送站内信？发送后不能撤回。")) return;
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const result = await apiPost<StaffMessageSendResponse>("/api/v1/staff/messages", payload);
      setJobToken(result.job_token);
      setJobStatus(result.status);
      window.localStorage.setItem("kp:mass-message-job", result.job_token);
      setMessage("发送中：后台任务正在处理…");
      setPreview(null);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "发送失败，请稍后重试");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6">
      {error && <Notice tone="warn">{error}</Notice>}
      {message && <Notice tone="info">{message}</Notice>}

      <Panel title="站内信内容" description="站内信会写入每个收件人的通知列表；不会发送邮件。">
        <div className="grid gap-4">
          <Field label="标题" htmlFor="message-title" required>
            <Input
              id="message-title"
              value={title}
              maxLength={190}
              onChange={(event) => setTitle(event.target.value)}
            />
          </Field>
          <Field label="正文" htmlFor="message-body" required hint="支持 Markdown，最多 5000 字">
            <Textarea
              id="message-body"
              value={body}
              rows={8}
              maxLength={5000}
              onChange={(event) => setBody(event.target.value)}
            />
          </Field>
          <Field
            label="跳转链接（可选）"
            htmlFor="message-link"
            hint="站内路径（/me）或 http(s) 地址"
          >
            <Input
              id="message-link"
              value={linkUrl}
              maxLength={500}
              onChange={(event) => setLinkUrl(event.target.value)}
            />
          </Field>
        </div>
      </Panel>

      <Panel
        title="收件人筛选"
        description="条件、用户组、用户 ID 同时作为筛选条件；全部留空时发送给全体 active 用户。"
      >
        <div className="grid gap-4">
          <Field label="条件关系" htmlFor="message-logic">
            <Select
              id="message-logic"
              value={logic}
              onChange={(event) => setLogic(event.target.value === "any" ? "any" : "all")}
            >
              <option value="all">满足全部条件</option>
              <option value="any">满足任一条件</option>
            </Select>
          </Field>

          <div className="grid gap-2">
            {rows.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center gap-2">
                <Select
                  value={row.metric}
                  onChange={(event) => updateCondition(row.id, { metric: event.target.value })}
                  className="h-9 w-44"
                  aria-label="筛选指标"
                >
                  {METRICS.map((metric) => (
                    <option key={metric.value} value={metric.value}>
                      {metric.label}
                    </option>
                  ))}
                </Select>
                <Select
                  value={row.op}
                  onChange={(event) =>
                    updateCondition(row.id, { op: event.target.value as ClassCondition["op"] })
                  }
                  className="h-9 w-20"
                  aria-label="比较方式"
                >
                  {OPS.map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </Select>
                <Input
                  type="number"
                  step="0.01"
                  value={row.value}
                  onChange={(event) => updateCondition(row.id, { value: Number(event.target.value) })}
                  className="h-9 w-28"
                  aria-label="筛选值"
                />
                {(row.metric === "uploaded" || row.metric === "downloaded") && (
                  <Select
                    value={row.unit ?? "GB"}
                    onChange={(event) =>
                      updateCondition(row.id, { unit: event.target.value as ClassCondition["unit"] })
                    }
                    className="h-9 w-24"
                    aria-label="流量单位"
                  >
                    {["B", "KB", "MB", "GB", "TB"].map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </Select>
                )}
                <Button
                  variant="ghost"
                  onClick={() => setRows((previous) => previous.filter((item) => item.id !== row.id))}
                >
                  删除
                </Button>
              </div>
            ))}
            <Button variant="default" onClick={addCondition} className="w-fit">
              添加条件
            </Button>
          </div>

          <div className="grid gap-2">
            <p className="text-xs font-medium text-fg-1">指定用户组（可多选，不选则不限制）</p>
            <div className="flex flex-wrap gap-2">
              {classes.map((item) => (
                <label
                  key={item.slug}
                  className="flex items-center gap-2 rounded-sm border border-line bg-surface-0 px-3 py-1.5 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={classSlugs.includes(item.slug)}
                    onChange={(event) =>
                      setClassSlugs((previous) =>
                        event.target.checked
                          ? [...previous, item.slug]
                          : previous.filter((slug) => slug !== item.slug),
                      )
                    }
                    className="size-[14px] accent-accent"
                  />
                  {item.name}（{item.slug}）
                </label>
              ))}
            </div>
          </div>

          <Field
            label="指定用户 ID（可选）"
            htmlFor="message-user-ids"
            hint="逗号、空格或换行分隔；会与条件、用户组取交集"
          >
            <Textarea
              id="message-user-ids"
              value={userIdsText}
              rows={3}
              onChange={(event) => setUserIdsText(event.target.value)}
              placeholder="1, 2, 3"
            />
          </Field>

          {preview && (
            <Notice tone="info">
              预计收件人：{preview.recipients} 人
              {preview.sample.length > 0 ? `；示例：${preview.sample.join("、")}` : ""}
            </Notice>
          )}

          <div className="flex flex-wrap gap-2">
            <Button variant="default" onClick={() => void runPreview()} disabled={pending || jobRunning}>
              {pending ? "处理中…" : "预览收件人"}
            </Button>
            <Button
              variant="primary"
              onClick={() => void send()}
              disabled={pending || jobRunning || !title.trim() || !body.trim()}
            >
              {jobRunning ? "发送中…" : "发送站内信"}
            </Button>
          </div>
        </div>
      </Panel>
    </div>
  );
}
