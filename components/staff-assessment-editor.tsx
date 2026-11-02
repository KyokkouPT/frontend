"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  AssessmentRequirementItem,
  StaffAssessmentBody,
  StaffAssessmentItem,
  StaffAssessmentParticipant,
} from "@kyokkou/contracts";
import { ApiClientError, apiFetch, apiPost } from "@/lib/api/client";
import { Button } from "./ui/button";
import { Field, Input, Select, Textarea } from "./ui/field";
import { Markdown } from "./markdown";
import { Notice } from "./notice";
import { Panel } from "./ui/panel";

const METRICS = [
  ["uploaded_delta", "上传增量"],
  ["downloaded_delta", "下载增量"],
  ["seedtime_delta", "做种时长增量（小时）"],
  ["bonus_delta", "魔力增量"],
  ["published_delta", "发布种子数"],
  ["ratio", "分享率"],
  ["last_active_days", "最近活跃天数"],
  ["warnings", "警告次数"],
  ["hnr_unfinished", "未完成 H&R"],
] as const;

const OPS = [">=", ">", "<=", "<", "==", "!="] as const;

type RequirementRow = {
  id: number;
  metric: AssessmentRequirementItem["metric"];
  op: AssessmentRequirementItem["op"];
  value: number;
  unit: "GB" | undefined;
};

type ClassOption = { slug: string; name: string; rank: number };

const EMPTY_REQUIREMENT: Omit<RequirementRow, "id"> = {
  metric: "uploaded_delta",
  op: ">=",
  value: 10,
  unit: "GB",
};

export function StaffAssessmentEditor({
  initial,
  classes,
}: {
  initial: StaffAssessmentItem[];
  classes: ClassOption[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"exam" | "task">("task");
  const [status, setStatus] = useState<StaffAssessmentItem["status"]>("active");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [durationDays, setDurationDays] = useState(30);
  const [classSlugs, setClassSlugs] = useState<string[]>([]);
  const [rows, setRows] = useState<RequirementRow[]>([{ ...EMPTY_REQUIREMENT, id: 1 }]);
  const [rewardBonus, setRewardBonus] = useState(1000);
  const [rewardInvite, setRewardInvite] = useState(0);
  const [rewardClass, setRewardClass] = useState("");
  const [rewardTitle, setRewardTitle] = useState("");
  const [penaltyBonus, setPenaltyBonus] = useState(100);
  const [penaltyInvite, setPenaltyInvite] = useState(0);
  const [penaltyWarn, setPenaltyWarn] = useState(0);
  const [penaltyClass, setPenaltyClass] = useState("");
  const [penaltySuspend, setPenaltySuspend] = useState(0);
  const [penaltyBan, setPenaltyBan] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [assignIds, setAssignIds] = useState<Record<number, string>>({});
  const [participants, setParticipants] = useState<Record<number, StaffAssessmentParticipant[]>>({});

  function patchRow(id: number, patch: Partial<RequirementRow>): void {
    setRows((previous) => previous.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function addRow(): void {
    setRows((previous) => [
      ...previous,
      { ...EMPTY_REQUIREMENT, id: Math.max(0, ...previous.map((row) => row.id)) + 1 },
    ]);
  }

  function buildBody(): StaffAssessmentBody {
    return {
      name: name.trim(),
      description_markdown: description.trim() || null,
      type,
      status,
      begin_at: null,
      end_at: null,
      duration_days: durationDays,
      recurring: "none",
      filters: { class_slugs: classSlugs },
      requirements: {
        logic: "all",
        items: rows.map((row) => ({
          metric: row.metric,
          op: row.op,
          value: Number(row.value),
          ...(row.metric === "uploaded_delta" || row.metric === "downloaded_delta"
            ? { unit: "GB" as const }
            : {}),
        })),
      },
      reward: {
        bonus: Number(rewardBonus),
        invite: Number(rewardInvite),
        class_slug: rewardClass || null,
        custom_title: rewardTitle.trim() || null,
      },
      penalty: {
        bonus: Number(penaltyBonus),
        invite: Number(penaltyInvite),
        warn: Number(penaltyWarn),
        class_slug: penaltyClass || null,
        suspend_days: Number(penaltySuspend),
        ban: penaltyBan,
      },
      max_participants: 0,
      allow_concurrent: true,
      settle_early: true,
    };
  }

  async function save(): Promise<void> {
    const body = buildBody();
    if (!body.name) {
      setError("请填写名称");
      return;
    }
    if (body.requirements.items.length === 0) {
      setError("至少添加一个指标");
      return;
    }
    if (
      (body.penalty.ban || body.penalty.suspend_days > 0 || body.penalty.class_slug) &&
      !window.confirm("该考核包含封禁、停用或降级处罚，确认保存？")
    ) {
      return;
    }
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const saved = editingId
        ? await apiFetch<StaffAssessmentItem>(`/api/v1/staff/assessments/${String(editingId)}`, {
            method: "PUT",
            body: JSON.stringify(body),
          })
        : await apiPost<StaffAssessmentItem>("/api/v1/staff/assessments", body);
      setItems((previous) =>
        editingId ? previous.map((item) => (item.id === editingId ? saved : item)) : [saved, ...previous],
      );
      setEditingId(null);
      setName("");
      setDescription("");
      setMessage(editingId ? "考核/任务已保存" : "考核/任务已创建");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "保存失败，请稍后重试");
    } finally {
      setPending(false);
    }
  }

  function edit(item: StaffAssessmentItem): void {
    setEditingId(item.id);
    setName(item.name);
    setDescription(item.description_markdown ?? "");
    setType(item.type);
    setStatus(item.status);
    setDurationDays(item.duration_days);
    setClassSlugs(item.filters.class_slugs ?? []);
    setRows(
      item.requirements.items.map((requirement, index) => ({
        id: index + 1,
        metric: requirement.metric,
        op: requirement.op,
        value: requirement.value,
        unit:
          requirement.metric === "uploaded_delta" || requirement.metric === "downloaded_delta"
            ? "GB"
            : undefined,
      })),
    );
    setRewardBonus(item.reward.bonus);
    setRewardInvite(item.reward.invite);
    setRewardClass(item.reward.class_slug ?? "");
    setRewardTitle(item.reward.custom_title ?? "");
    setPenaltyBonus(item.penalty.bonus);
    setPenaltyInvite(item.penalty.invite);
    setPenaltyWarn(item.penalty.warn);
    setPenaltyClass(item.penalty.class_slug ?? "");
    setPenaltySuspend(item.penalty.suspend_days);
    setPenaltyBan(item.penalty.ban);
    setError(null);
    setMessage(`正在编辑「${item.name}」`);
  }

  async function preview(): Promise<void> {
    setPending(true);
    setError(null);
    try {
      const result = await apiPost<{ matched: number }>("/api/v1/staff/assessments/preview", buildBody());
      setMessage(`预计匹配 ${String(result.matched)} 名用户`);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "预览失败");
    } finally {
      setPending(false);
    }
  }

  async function assign(item: StaffAssessmentItem): Promise<void> {
    const ids = (assignIds[item.id] ?? "")
      .split(/[\s,;，；]+/)
      .map(Number)
      .filter((value) => Number.isInteger(value) && value > 0);
    if (ids.length === 0) {
      setError("请输入用户 ID");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const result = await apiPost<{ assigned: number; skipped: number }>(
        `/api/v1/staff/assessments/${String(item.id)}/assign`,
        { user_ids: ids },
      );
      setMessage(`已分配 ${String(result.assigned)} 人，跳过 ${String(result.skipped)} 人`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "分配失败");
    } finally {
      setPending(false);
    }
  }

  async function checkout(item: StaffAssessmentItem): Promise<void> {
    if (!window.confirm(`确认强制结算「${item.name}」的所有进行中实例？`)) return;
    setPending(true);
    setError(null);
    try {
      const result = await apiPost<{ settled: number }>(
        `/api/v1/staff/assessments/${String(item.id)}/checkout`,
      );
      setMessage(`已结算 ${String(result.settled)} 个实例`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "结算失败");
    } finally {
      setPending(false);
    }
  }

  async function loadParticipants(item: StaffAssessmentItem): Promise<void> {
    setPending(true);
    setError(null);
    try {
      const result = await apiFetch<{ items: StaffAssessmentParticipant[] }>(
        `/api/v1/staff/assessments/${String(item.id)}/participants`,
      );
      setParticipants((previous) => ({ ...previous, [item.id]: result.items }));
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "参与列表加载失败");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6">
      {error && <Notice tone="warn">{error}</Notice>}
      {message && <Notice tone="info">{message}</Notice>}

      <Panel
        title={editingId ? "编辑考核 / 任务" : "新建考核 / 任务"}
        description="第一版为手动分配/领取，周期功能后续开放"
      >
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="名称" htmlFor="assessment-name" required>
              <Input
                id="assessment-name"
                value={name}
                maxLength={190}
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
            <Field label="类型" htmlFor="assessment-type">
              <Select
                id="assessment-type"
                value={type}
                onChange={(event) => setType(event.target.value === "exam" ? "exam" : "task")}
              >
                <option value="task">任务（用户领取）</option>
                <option value="exam">考核（Staff 分配）</option>
              </Select>
            </Field>
            <Field label="状态" htmlFor="assessment-status">
              <Select
                id="assessment-status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as StaffAssessmentItem["status"])
                }
              >
                <option value="active">启用</option>
                <option value="draft">草稿</option>
                <option value="paused">暂停</option>
                <option value="archived">归档</option>
              </Select>
            </Field>
            <Field label="领取后有效天数" htmlFor="assessment-duration">
              <Input
                id="assessment-duration"
                type="number"
                min={1}
                max={3650}
                value={durationDays}
                onChange={(event) => setDurationDays(Number(event.target.value))}
              />
            </Field>
          </div>
          <Field label="说明（Markdown）" htmlFor="assessment-description">
            <Textarea
              id="assessment-description"
              rows={5}
              value={description}
              maxLength={20000}
              onChange={(event) => setDescription(event.target.value)}
            />
          </Field>

          <div className="grid gap-2">
            <p className="text-xs font-medium text-fg-1">指标要求</p>
            {rows.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center gap-2">
                <Select
                  value={row.metric}
                  onChange={(event) =>
                    patchRow(row.id, {
                      metric: event.target.value as RequirementRow["metric"],
                      unit:
                        event.target.value === "uploaded_delta" ||
                        event.target.value === "downloaded_delta"
                          ? "GB"
                          : undefined,
                    })
                  }
                  className="h-9 w-52"
                >
                  {METRICS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
                <Select
                  value={row.op}
                  onChange={(event) =>
                    patchRow(row.id, { op: event.target.value as RequirementRow["op"] })
                  }
                  className="h-9 w-20"
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
                  onChange={(event) => patchRow(row.id, { value: Number(event.target.value) })}
                  className="h-9 w-28"
                />
                {(row.metric === "uploaded_delta" || row.metric === "downloaded_delta") && (
                  <span className="text-xs text-fg-2">GB</span>
                )}
                <Button
                  variant="ghost"
                  onClick={() =>
                    setRows((previous) => previous.filter((item) => item.id !== row.id))
                  }
                >
                  删除
                </Button>
              </div>
            ))}
            <Button variant="default" className="w-fit" onClick={addRow}>
              添加指标
            </Button>
          </div>

          <div className="grid gap-2">
            <p className="text-xs font-medium text-fg-1">目标用户组（不选则全体 active 用户）</p>
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
                  {item.name}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="奖励魔力" htmlFor="reward-bonus">
              <Input
                id="reward-bonus"
                type="number"
                min={0}
                value={rewardBonus}
                onChange={(event) => setRewardBonus(Number(event.target.value))}
              />
            </Field>
            <Field label="奖励邀请" htmlFor="reward-invite">
              <Input
                id="reward-invite"
                type="number"
                min={0}
                value={rewardInvite}
                onChange={(event) => setRewardInvite(Number(event.target.value))}
              />
            </Field>
            <Field label="奖励等级" htmlFor="reward-class">
              <Select id="reward-class" value={rewardClass} onChange={(event) => setRewardClass(event.target.value)}>
                <option value="">不奖励等级</option>
                {classes.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="奖励头衔" htmlFor="reward-title">
              <Input
                id="reward-title"
                value={rewardTitle}
                maxLength={64}
                onChange={(event) => setRewardTitle(event.target.value)}
              />
            </Field>
            <Field label="处罚魔力" htmlFor="penalty-bonus">
              <Input
                id="penalty-bonus"
                type="number"
                min={0}
                value={penaltyBonus}
                onChange={(event) => setPenaltyBonus(Number(event.target.value))}
              />
            </Field>
            <Field label="处罚邀请" htmlFor="penalty-invite">
              <Input
                id="penalty-invite"
                type="number"
                min={0}
                value={penaltyInvite}
                onChange={(event) => setPenaltyInvite(Number(event.target.value))}
              />
            </Field>
            <Field label="警告" htmlFor="penalty-warn">
              <Input
                id="penalty-warn"
                type="number"
                min={0}
                value={penaltyWarn}
                onChange={(event) => setPenaltyWarn(Number(event.target.value))}
              />
            </Field>
            <Field label="降级到" htmlFor="penalty-class">
              <Select id="penalty-class" value={penaltyClass} onChange={(event) => setPenaltyClass(event.target.value)}>
                <option value="">不降级</option>
                {classes.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="停用天数" htmlFor="penalty-suspend">
              <Input
                id="penalty-suspend"
                type="number"
                min={0}
                max={3650}
                value={penaltySuspend}
                onChange={(event) => setPenaltySuspend(Number(event.target.value))}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={penaltyBan}
                onChange={(event) => setPenaltyBan(event.target.checked)}
                className="size-[15px] accent-accent"
              />
              失败封禁
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="default" onClick={() => void preview()} disabled={pending}>
              预览匹配人数
            </Button>
            <Button variant="primary" onClick={() => void save()} disabled={pending}>
              {pending ? "处理中…" : editingId ? "保存修改" : "创建考核 / 任务"}
            </Button>
            {editingId && (
              <Button
                variant="ghost"
                onClick={() => {
                  setEditingId(null);
                  setName("");
                  setDescription("");
                  setMessage(null);
                }}
              >
                取消编辑
              </Button>
            )}
          </div>
        </div>
      </Panel>

      <Panel title="已创建" description="分配用户后，用户会收到站内信">
        {items.length === 0 ? (
          <p className="text-sm text-fg-2">还没有考核或任务。</p>
        ) : (
          <div className="grid gap-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-md border border-line bg-surface-0 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <b className="text-sm font-semibold">{item.name}</b>
                  <span className="text-xs text-fg-2">
                    {item.type === "exam" ? "考核" : "任务"} · {item.status}
                  </span>
                  <span className="ml-auto text-2xs text-fg-2">
                    参与 {item.participants} · 进行中 {item.active_participants} · 通过 {item.passed} · 失败{" "}
                    {item.failed}
                  </span>
                </div>
                {item.description_markdown && (
                  <Markdown className="mt-2 text-xs">{item.description_markdown}</Markdown>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Input
                    value={assignIds[item.id] ?? ""}
                    onChange={(event) =>
                      setAssignIds((previous) => ({ ...previous, [item.id]: event.target.value }))
                    }
                    placeholder="用户 ID，逗号分隔"
                    className="h-9 w-56"
                  />
                  <Button variant="default" onClick={() => void assign(item)} disabled={pending}>
                    分配
                  </Button>
                  <Button variant="ghost" onClick={() => edit(item)} disabled={pending}>
                    编辑
                  </Button>
                  <Button variant="ghost" onClick={() => void checkout(item)} disabled={pending}>
                    强制结算
                  </Button>
                  <Button variant="ghost" onClick={() => void loadParticipants(item)} disabled={pending}>
                    参与列表
                  </Button>
                </div>
                {participants[item.id] && (
                  <div className="mt-3 overflow-x-auto border-t border-line pt-3">
                    {participants[item.id].length === 0 ? (
                      <p className="text-xs text-fg-2">暂无参与记录。</p>
                    ) : (
                      <table className="w-full min-w-[720px] text-left text-xs">
                        <thead>
                          <tr className="border-b border-line text-fg-2">
                            <th className="py-1.5 pr-3 font-medium">用户</th>
                            <th className="px-3 py-1.5 font-medium">状态</th>
                            <th className="px-3 py-1.5 font-medium">进度</th>
                            <th className="px-3 py-1.5 font-medium">结果</th>
                          </tr>
                        </thead>
                        <tbody>
                          {participants[item.id].map((participant) => (
                            <tr key={participant.assignment_id} className="border-b border-line/50 last:border-0">
                              <td className="py-1.5 pr-3 font-medium">{participant.username}</td>
                              <td className="px-3 py-1.5">{participant.status}</td>
                              <td className="px-3 py-1.5">
                                {participant.progress
                                  .map((progress) => `${progress.label}: ${progress.current}/${progress.target}`)
                                  .join(" · ") || "—"}
                              </td>
                              <td className="px-3 py-1.5 text-fg-2">
                                {participant.result_reason ?? "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
