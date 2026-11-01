"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ClassCondition, ClassItem, ClassRule } from "@kyokkou/contracts";
import { ApiClientError, apiFetch } from "@/lib/api/client";
import { Button } from "./ui/button";
import { Field, Input, Select, Textarea } from "./ui/field";
import { Notice } from "./notice";

const METRICS = [
  { value: "age_days", label: "注册天数" },
  { value: "uploaded", label: "上传量" },
  { value: "downloaded", label: "下载量" },
  { value: "ratio", label: "分享率" },
  { value: "seedtime_hours", label: "做种时长（小时）" },
  { value: "bonus", label: "魔力值/做种积分" },
  { value: "torrents_published", label: "发布数" },
  { value: "invites_used", label: "已用邀请" },
  { value: "warnings", label: "警告次数" },
  { value: "hnr_unfinished", label: "未完成 H&R" },
  { value: "last_active_days", label: "最近活跃（天）" },
];

const OPS = [">=", ">", "<=", "<", "==", "!="];
const UNITS = ["B", "KB", "MB", "GB", "TB"];

const PERMISSION_GROUPS: { label: string; items: { key: string; label: string }[] }[] = [
  {
    label: "升降控制",
    items: [
      { key: "class.auto_promote", label: "允许自动升入" },
      { key: "class.auto_demote", label: "允许自动降出" },
    ],
  },
  {
    label: "内容 / 种子",
    items: [
      { key: "torrent.upload", label: "发布种子" },
      { key: "torrent.download", label: "下载/使用 Tracker" },
      { key: "torrent.auto_approve", label: "免审发布" },
      { key: "torrent.anonymous", label: "匿名发布" },
      { key: "torrent.view_hidden", label: "查看隐藏种子" },
      { key: "torrent.edit", label: "编辑种子" },
      { key: "torrent.delete", label: "删除种子" },
      { key: "torrent.pin", label: "置顶种子" },
      { key: "torrent.promote", label: "设置促销" },
      { key: "request.create", label: "发布求种" },
      { key: "request.fulfill", label: "响应求种" },
      { key: "subtitle.upload", label: "上传字幕" },
      { key: "comment.post", label: "发表评论" },
      { key: "comment.moderate", label: "管理评论" },
    ],
  },
  {
    label: "用户 / 社区",
    items: [
      { key: "user.view_profile", label: "查看用户主页" },
      { key: "user.donor", label: "捐赠者（魔力 3 倍）" },
      { key: "user.list", label: "查看会员列表" },
      { key: "user.search", label: "搜索用户" },
      { key: "user.view_history", label: "查看他人种子历史" },
      { key: "user.view_comments", label: "查看他人评论历史" },
      { key: "user.view_anonymous", label: "查看匿名身份" },
      { key: "ranking.view", label: "查看排行榜" },
      { key: "log.view", label: "查看普通日志" },
      { key: "log.view_sensitive", label: "查看机密日志" },
      { key: "invite.create", label: "生成邀请" },
      { key: "bonus.exchange", label: "魔力兑换" },
      { key: "rss.read", label: "RSS 订阅" },
      { key: "poll.create", label: "发起投票" },
    ],
  },
  {
    label: "管理",
    items: [
      { key: "staff.available", label: "staff.available（管理权限总开关）" },
      { key: "staff.access", label: "站务后台" },
      { key: "staff.review", label: "审核台" },
      { key: "staff.reports", label: "举报处理" },
      { key: "staff.users", label: "用户管理/创建用户" },
      { key: "staff.bonus_shop", label: "魔力值商店管理" },
      { key: "staff.anomalies", label: "反作弊" },
      { key: "staff.audit", label: "审计日志" },
      { key: "staff.settings", label: "站点设置/调度" },
      { key: "staff.classes", label: "等级管理" },
      { key: "staff.class_simulate", label: "升降模拟" },
      { key: "staff.class_history", label: "等级历史" },
      { key: "staff.appeals", label: "申诉处理" },
      { key: "staff.announcement", label: "公告管理" },
      { key: "staff.user_warn", label: "警告用户" },
      { key: "staff.invite_view", label: "查看邀请记录" },
      { key: "staff.ip_view", label: "查看 IP/邮箱" },
    ],
  },
  {
    label: "用户字段编辑（staff.user_edit.*）",
    items: [
      { key: "staff.user_edit.password", label: "重置密码" },
      { key: "staff.user_edit.username", label: "修改用户名（含 admin）" },
      { key: "staff.user_edit.email", label: "修改邮箱" },
      { key: "staff.user_edit.class", label: "修改等级" },
      { key: "staff.user_edit.status", label: "修改状态" },
      { key: "staff.user_edit.bonus", label: "修改魔力值" },
      { key: "staff.user_edit.uploaded", label: "修改上传量" },
      { key: "staff.user_edit.downloaded", label: "修改下载量" },
      { key: "staff.user_edit.invite_balance", label: "修改邀请余额" },
      { key: "staff.user_edit.warnings", label: "修改警告" },
      { key: "staff.user_edit.custom_title", label: "修改头衔（预留）" },
    ],
  },
];

type ConditionRow = ClassCondition & { id: number };

let nextId = 1;
function row(condition?: ClassCondition): ConditionRow {
  return {
    id: nextId++,
    metric: condition?.metric ?? "age_days",
    op: condition?.op ?? ">=",
    value: condition?.value ?? 0,
    ...(condition?.unit ? { unit: condition.unit } : {}),
  };
}

function ConditionEditor({
  logic,
  onLogic,
  rows,
  onChange,
}: {
  logic: "all" | "any";
  onLogic: (logic: "all" | "any") => void;
  rows: ConditionRow[];
  onChange: (rows: ConditionRow[]) => void;
}) {
  function update(id: number, patch: Partial<ConditionRow>): void {
    onChange(rows.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-fg-1">逻辑组合</span>
        <Select
          value={logic}
          onChange={(event) => onLogic(event.target.value as "all" | "any")}
          className="h-9 w-40"
          aria-label="逻辑组合"
        >
          <option value="all">全部满足（AND）</option>
          <option value="any">任一满足（OR）</option>
        </Select>
        <span className="text-xs text-fg-2">作用于下方全部条件</span>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-sm border border-dashed border-line px-3 py-2 text-xs text-fg-2">
          暂无条件（空条件 = 所有人都满足 / 不限）。
        </p>
      ) : (
        <div className="grid gap-2">
          {rows.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center gap-2 rounded-sm border border-line bg-surface-2 p-2">
              <Select
                value={item.metric}
                onChange={(event) => update(item.id, { metric: event.target.value })}
                className="h-9 w-44"
                aria-label="指标"
              >
                {METRICS.map((metric) => (
                  <option key={metric.value} value={metric.value}>
                    {metric.label}
                  </option>
                ))}
              </Select>
              <Select
                value={item.op}
                onChange={(event) =>
                  update(item.id, { op: event.target.value as ClassCondition["op"] })
                }
                className="h-9 w-20"
                aria-label="运算符"
              >
                {OPS.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </Select>
              <Input
                type="number"
                step="any"
                value={item.value}
                onChange={(event) => update(item.id, { value: Number(event.target.value) })}
                className="h-9 w-28"
                aria-label="数值"
              />
              {(item.metric === "uploaded" || item.metric === "downloaded") && (
                <Select
                  value={item.unit ?? "GB"}
                  onChange={(event) => update(item.id, { unit: event.target.value as ClassCondition["unit"] })}
                  className="h-9 w-20"
                  aria-label="单位"
                >
                  {UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </Select>
              )}
              <Button
                type="button"
                variant="ghost"
                className="ml-auto h-9"
                onClick={() => onChange(rows.filter((entry) => entry.id !== item.id))}
              >
                删除
              </Button>
            </div>
          ))}
        </div>
      )}

      <div>
        <Button type="button" variant="default" onClick={() => onChange([...rows, row()])}>
          添加条件
        </Button>
      </div>
    </div>
  );
}

function toRule(logic: "all" | "any", rows: ConditionRow[]): ClassRule | null {
  if (rows.length === 0) return null;
  return {
    logic,
    conditions: rows.map(({ metric, op, value, unit }) => ({
      metric,
      op,
      value,
      ...(unit ? { unit } : {}),
    })),
  };
}

function flagsOf(item?: ClassItem): string[] {
  return item?.permissions ?? [
    "class.auto_promote",
    "class.auto_demote",
    "torrent.upload",
    "torrent.download",
  ];
}

export function ClassForm({ mode, item }: { mode: "create" | "edit"; item?: ClassItem }) {
  const router = useRouter();
  const [slug, setSlug] = useState(item?.slug ?? "");
  const [name, setName] = useState(item?.name ?? "");
  const [rank, setRank] = useState(item?.rank ?? 10);
  const [badge, setBadge] = useState(item?.badge ?? "");
  const [color, setColor] = useState(item?.color ?? "accent");
  const [description, setDescription] = useState(item?.description ?? "");
  const [permissions, setPermissions] = useState<Set<string>>(() => new Set(flagsOf(item)));
  const [inviteQuota, setInviteQuota] = useState(item?.invite_quota ?? 0);
  const [autoApproveQuota, setAutoApproveQuota] = useState(item?.auto_approve_quota ?? 0);
  const [promoteLogic, setPromoteLogic] = useState<"all" | "any">(item?.promote_rule?.logic ?? "all");
  const [promoteRows, setPromoteRows] = useState<ConditionRow[]>(() =>
    item?.promote_rule?.conditions.map((condition) => row(condition)) ?? [],
  );
  const [demoteEnabled, setDemoteEnabled] = useState(Boolean(item?.demote_rule));
  const [demoteLogic, setDemoteLogic] = useState<"all" | "any">(item?.demote_rule?.logic ?? "any");
  const [demoteRows, setDemoteRows] = useState<ConditionRow[]>(() =>
    item?.demote_rule?.conditions.map((condition) => row(condition)) ?? [],
  );
  const [promoteGrace, setPromoteGrace] = useState(item?.promote_grace_days ?? 0);
  const [demoteGrace, setDemoteGrace] = useState(item?.demote_grace_days ?? 0);
  const [lockManual, setLockManual] = useState(item?.lock_manual ?? false);
  const [manualGrantable, setManualGrantable] = useState(item?.manual_grantable ?? true);
  const [visible, setVisible] = useState(item?.visible ?? true);
  const [exemptHr, setExemptHr] = useState(item?.exempt_hr ?? false);
  const [exemptMatrix, setExemptMatrix] = useState(item?.exempt_ratio_matrix ?? false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const staffMissing = useMemo(() => {
    const hasStaff = [...permissions].some((permission) => permission.startsWith("staff."));
    return hasStaff && !permissions.has("staff.available");
  }, [permissions]);

  function togglePermission(key: string, checked: boolean): void {
    setPermissions((previous) => {
      const next = new Set(previous);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (staffMissing) {
      setError("勾选了 staff.* 权限时必须同时勾选 staff.available");
      return;
    }
    setPending(true);
    setError(null);
    const body = {
      name: name.trim(),
      rank: Number(rank),
      badge: badge.trim() || null,
      color: color.trim() || null,
      description: description.trim(),
      permissions: [...permissions].sort(),
      invite_quota: Number(inviteQuota),
      auto_approve_quota: Number(autoApproveQuota),
      promote_rule: toRule(promoteLogic, promoteRows),
      demote_rule: demoteEnabled ? toRule(demoteLogic, demoteRows) : null,
      promote_grace_days: Number(promoteGrace),
      demote_grace_days: Number(demoteGrace),
      lock_manual: lockManual,
      manual_grantable: manualGrantable,
      visible,
      exempt_hr: exemptHr,
      exempt_ratio_matrix: exemptMatrix,
    };

    try {
      if (mode === "create") {
        await apiFetch("/api/v1/staff/classes", {
          method: "POST",
          body: JSON.stringify({ ...body, slug: slug.trim() }),
        });
      } else if (item) {
        await apiFetch(`/api/v1/staff/classes/${item.slug}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      }
      router.push("/staff/classes");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "保存失败");
      setPending(false);
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="grid gap-5">
      {error && <Notice tone="warn">{error}</Notice>}

      <section className="grid gap-3 rounded-lg border border-line bg-surface-1 p-5">
        <h2 className="text-sm font-semibold">基础信息</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="等级标识（slug）" htmlFor="class-slug" required hint="小写字母/数字/连字符；创建后不可改">
            <Input
              id="class-slug"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              disabled={mode === "edit"}
              required
            />
          </Field>
          <Field label="名称" htmlFor="class-name" required>
            <Input id="class-name" value={name} onChange={(event) => setName(event.target.value)} required />
          </Field>
          <Field label="排序 rank" htmlFor="class-rank" hint="越大越高；只能管理低于自己 rank 的等级">
            <Input
              id="class-rank"
              type="number"
              value={rank}
              onChange={(event) => setRank(Number(event.target.value))}
            />
          </Field>
          <Field label="徽章/颜色" htmlFor="class-badge" hint="徽章文本可空；颜色如 accent / danger">
            <div className="flex gap-2">
              <Input id="class-badge" value={badge} onChange={(event) => setBadge(event.target.value)} />
              <Input value={color} onChange={(event) => setColor(event.target.value)} />
            </div>
          </Field>
          <Field label="说明" htmlFor="class-desc" className="sm:col-span-2">
            <Textarea
              id="class-desc"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={2}
            />
          </Field>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
            前台可见
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={lockManual} onChange={(e) => setLockManual(e.target.checked)} />
            手动授予后锁定
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={manualGrantable}
              onChange={(e) => setManualGrantable(e.target.checked)}
            />
            允许手动授予
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={exemptHr} onChange={(e) => setExemptHr(e.target.checked)} />
            豁免 H&R
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={exemptMatrix}
              onChange={(e) => setExemptMatrix(e.target.checked)}
            />
            豁免分享率矩阵
          </label>
        </div>
      </section>

      <section className="grid gap-3 rounded-lg border border-line bg-surface-1 p-5">
        <h2 className="text-sm font-semibold">数量型特权</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="邀请名额" htmlFor="class-invites" hint="升级时增量发放（旧剩余 + 新名额）">
            <Input
              id="class-invites"
              type="number"
              min={0}
              max={100}
              value={inviteQuota}
              onChange={(event) => setInviteQuota(Number(event.target.value))}
            />
          </Field>
          <Field label="免审额度" htmlFor="class-autoapprove" hint="每月可用免审发布次数">
            <Input
              id="class-autoapprove"
              type="number"
              min={0}
              max={100}
              value={autoApproveQuota}
              onChange={(event) => setAutoApproveQuota(Number(event.target.value))}
            />
          </Field>
        </div>
      </section>

      <section className="grid gap-3 rounded-lg border border-line bg-surface-1 p-5">
        <h2 className="text-sm font-semibold">升级条件</h2>
        <ConditionEditor logic={promoteLogic} onLogic={setPromoteLogic} rows={promoteRows} onChange={setPromoteRows} />
        <Field label="升级观察期（天）" htmlFor="class-promote-grace" hint="0 = 立即升级；>0 需要连续达标">
          <Input
            id="class-promote-grace"
            type="number"
            min={0}
            max={365}
            value={promoteGrace}
            onChange={(event) => setPromoteGrace(Number(event.target.value))}
            className="w-40"
          />
        </Field>
      </section>

      <section className="grid gap-3 rounded-lg border border-line bg-surface-1 p-5">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={demoteEnabled}
            onChange={(event) => setDemoteEnabled(event.target.checked)}
          />
          独立降级条件（勾选后只按此规则降级；不勾选时用升级规则判断）
        </label>
        {demoteEnabled && (
          <ConditionEditor logic={demoteLogic} onLogic={setDemoteLogic} rows={demoteRows} onChange={setDemoteRows} />
        )}
        <Field
          label="降级观察期（天）"
          htmlFor="class-demote-grace"
          hint="0 = 命中后立即降级；>0 先预警，到期后重算才降级"
        >
          <Input
            id="class-demote-grace"
            type="number"
            min={0}
            max={365}
            value={demoteGrace}
            onChange={(event) => setDemoteGrace(Number(event.target.value))}
            className="w-40"
          />
        </Field>
      </section>

      <section className="grid gap-3 rounded-lg border border-line bg-surface-1 p-5">
        <h2 className="text-sm font-semibold">权限节点</h2>
        {staffMissing && <Notice tone="warn">勾选了 staff.* 权限时必须同时勾选 staff.available</Notice>}
        {PERMISSION_GROUPS.map((group) => (
          <div key={group.label} className="grid gap-2 border-t border-line pt-3 first:border-0 first:pt-0">
            <p className="text-xs font-medium text-fg-2">{group.label}</p>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {group.items.map((permission) => (
                <label key={permission.key} className="flex items-center gap-2 text-sm text-fg-1">
                  <input
                    type="checkbox"
                    checked={permissions.has(permission.key)}
                    onChange={(event) => togglePermission(permission.key, event.target.checked)}
                  />
                  <span className="font-mono text-2xs text-fg-2">{permission.key}</span>
                  <span>{permission.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </section>

      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" disabled={pending || staffMissing}>
          {pending ? "保存中…" : mode === "create" ? "创建等级" : "保存修改"}
        </Button>
        <Link
          href="/staff/classes"
          className="inline-flex h-10 items-center rounded-sm border border-line bg-surface-1 px-4 text-sm text-fg-1 hover:border-line-strong hover:text-fg-0"
        >
          取消
        </Link>
      </div>
    </form>
  );
}
