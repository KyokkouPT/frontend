"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { StaffUserItem } from "@kyokkou/contracts";
import { ApiClientError, apiFetch, apiPost } from "@/lib/api/client";
import { formatBytes } from "@/lib/format";
import { Button } from "./ui/button";
import { Field, Input, Select } from "./ui/field";
import { Notice } from "./notice";

type ClassOption = { slug: string; name: string; rank: number };

const GB = 1024 ** 3;

function roundBonus(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function bonusText(value: number): string {
  return roundBonus(value).toFixed(2);
}

const EDIT_FIELDS = {
  password: "staff.user_edit.password",
  username: "staff.user_edit.username",
  email: "staff.user_edit.email",
  class: "staff.user_edit.class",
  status: "staff.user_edit.status",
  bonus: "staff.user_edit.bonus",
  uploaded: "staff.user_edit.uploaded",
  downloaded: "staff.user_edit.downloaded",
  invite: "staff.user_edit.invite_balance",
  warnings: "staff.user_edit.warnings",
  customTitle: "staff.user_edit.custom_title",
} as const;

function toGbText(bytes: number): string {
  return String(Math.round((bytes / GB) * 100) / 100);
}

function errorText(error: unknown, fallback: string): string {
  return error instanceof ApiClientError ? (error.fields?.[0]?.message ?? error.message) : fallback;
}

/** 新建与编辑共用同一个用户表单布局；编辑字段按 staff.user_edit.* 权限渲染。 */
export function UserForm({
  mode,
  user,
  classes,
  permissions,
}: {
  mode: "create" | "edit";
  user?: StaffUserItem;
  classes: ClassOption[];
  permissions: string[];
}) {
  const router = useRouter();
  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [classSlug, setClassSlug] = useState(
    user?.class.slug ?? classes.find((item) => item.slug === "user")?.slug ?? "user",
  );
  const [status, setStatus] = useState(user?.status ?? "active");
  const [uploadedGb, setUploadedGb] = useState(user ? toGbText(user.uploaded) : "0");
  const [downloadedGb, setDownloadedGb] = useState(user ? toGbText(user.downloaded) : "0");
  const [bonus, setBonus] = useState(user ? bonusText(user.bonus) : "0.00");
  const [inviteBalance, setInviteBalance] = useState(user ? String(user.invite_balance) : "0");
  const [warnings, setWarnings] = useState(user ? String(user.warnings) : "0");
  const [customTitle, setCustomTitle] = useState(user?.custom_title ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const can = (key: keyof typeof EDIT_FIELDS) => permissions.includes(EDIT_FIELDS[key]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      if (mode === "create") {
        await apiPost("/api/v1/staff/users", {
          username: username.trim(),
          email: email.trim(),
          password,
          class_slug: classSlug,
        });
      } else if (user) {
        const payload: Record<string, unknown> = {};
        if (can("username") && username.trim() !== user.username) payload.username = username.trim();
        if (can("email")) payload.email = email.trim();
        if (can("class") && classSlug !== user.class.slug) payload.class_slug = classSlug;
        if (can("status")) payload.status = status;
        if (can("password") && password.length > 0) payload.password = password;

        const nextUploaded = Math.floor(Number(uploadedGb) * GB);
        const nextDownloaded = Math.floor(Number(downloadedGb) * GB);
        const nextBonus = roundBonus(Number(bonus));
        const nextInvite = Number(inviteBalance);
        const nextWarnings = Number(warnings);
        if (can("uploaded") && Number.isFinite(nextUploaded) && toGbText(nextUploaded) !== toGbText(user.uploaded)) {
          payload.uploaded = nextUploaded;
        }
        if (
          can("downloaded") &&
          Number.isFinite(nextDownloaded) &&
          toGbText(nextDownloaded) !== toGbText(user.downloaded)
        ) {
          payload.downloaded = nextDownloaded;
        }
        if (can("bonus") && Number.isFinite(nextBonus) && nextBonus !== roundBonus(user.bonus)) {
          payload.bonus = nextBonus;
        }
        if (can("invite") && Number.isInteger(nextInvite) && nextInvite !== user.invite_balance) {
          payload.invite_balance = nextInvite;
        }
        if (can("warnings") && Number.isInteger(nextWarnings) && nextWarnings !== user.warnings) {
          payload.warnings = nextWarnings;
        }
        if (can("customTitle") && customTitle.trim() !== (user.custom_title ?? "")) {
          payload.custom_title = customTitle.trim() || null;
        }

        await apiFetch(`/api/v1/staff/users/${String(user.id)}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      }
      router.push("/staff/users");
      router.refresh();
    } catch (caught) {
      setError(errorText(caught, mode === "create" ? "创建用户失败" : "保存失败"));
      setPending(false);
    }
  }

  const hasAnyEditPermission = Object.values(EDIT_FIELDS).some((permission) =>
    permissions.includes(permission),
  );

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-lg border border-line bg-surface-1 p-5">
      {error && <Notice tone="warn">{error}</Notice>}
      {mode === "edit" && !hasAnyEditPermission && (
        <Notice tone="warn">当前账号没有任何用户字段编辑权限。</Notice>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {(mode === "create" || can("username")) && (
          <Field
            label="用户名"
            htmlFor="user-username"
            required={mode === "create"}
            hint={mode === "create" ? "3–32 位，小写字母/数字/下划线/连字符" : "修改后立即生效"}
          >
            <Input
              id="user-username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required={mode === "create"}
              minLength={mode === "create" ? 3 : undefined}
              maxLength={32}
              autoCapitalize="none"
              spellCheck={false}
            />
          </Field>
        )}

        {(mode === "create" || can("email")) && (
          <Field label="邮箱" htmlFor="user-email" required={mode === "create"}>
            <Input
              id="user-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required={mode === "create"}
            />
          </Field>
        )}

        {(mode === "create" || can("password")) && (
          <Field
            label={mode === "create" ? "密码" : "重置密码"}
            htmlFor="user-password"
            required={mode === "create"}
            hint={mode === "edit" ? "留空不修改" : "至少 8 位"}
          >
            <Input
              id="user-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required={mode === "create"}
              minLength={8}
            />
          </Field>
        )}

        {(mode === "create" || can("class")) && (
          <Field label="等级" htmlFor="user-class" hint="只能授予 rank 不高于自己的等级">
            <Select id="user-class" value={classSlug} onChange={(event) => setClassSlug(event.target.value)}>
              {classes.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}（{item.slug}，rank {item.rank}）
                </option>
              ))}
            </Select>
          </Field>
        )}

        {mode === "edit" && can("status") && (
          <Field label="状态" htmlFor="user-status">
            <Select id="user-status" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
              <option value="active">正常</option>
              <option value="suspended">停用</option>
              <option value="banned">封禁</option>
            </Select>
          </Field>
        )}

        {mode === "edit" && can("uploaded") && (
          <Field
            label="上传量（GB）"
            htmlFor="user-uploaded"
            hint={`计入量；实际 ${formatBytes(user?.raw_uploaded ?? 0)}，修改不改变实际流量`}
          >
            <Input
              id="user-uploaded"
              type="number"
              step="0.01"
              min="0"
              value={uploadedGb}
              onChange={(event) => setUploadedGb(event.target.value)}
            />
          </Field>
        )}

        {mode === "edit" && can("downloaded") && (
          <Field
            label="下载量（GB）"
            htmlFor="user-downloaded"
            hint={`计入量；实际 ${formatBytes(user?.raw_downloaded ?? 0)}，修改不改变实际流量`}
          >
            <Input
              id="user-downloaded"
              type="number"
              step="0.01"
              min="0"
              value={downloadedGb}
              onChange={(event) => setDownloadedGb(event.target.value)}
            />
          </Field>
        )}

        {mode === "edit" && can("bonus") && (
          <Field label="魔力值" htmlFor="user-bonus" hint="最多两位小数；调整会写入魔力账本">
            <Input
              id="user-bonus"
              type="number"
              step="0.01"
              min="0"
              value={bonus}
              onChange={(event) => setBonus(event.target.value)}
              onBlur={() => {
                const value = Number(bonus);
                if (Number.isFinite(value)) setBonus(bonusText(value));
              }}
            />
          </Field>
        )}

        {mode === "edit" && can("invite") && (
          <Field label="邀请余额" htmlFor="user-invite" hint="尚未生成邀请码的额度">
            <Input
              id="user-invite"
              type="number"
              step="1"
              min="0"
              value={inviteBalance}
              onChange={(event) => setInviteBalance(event.target.value)}
            />
          </Field>
        )}

        {mode === "edit" && can("warnings") && (
          <Field label="警告次数" htmlFor="user-warnings">
            <Input
              id="user-warnings"
              type="number"
              step="1"
              min="0"
              value={warnings}
              onChange={(event) => setWarnings(event.target.value)}
            />
          </Field>
        )}

        {mode === "edit" && can("customTitle") && (
          <Field label="自定义头衔" htmlFor="user-custom-title" hint="留空清除；不能含 emoji">
            <Input
              id="user-custom-title"
              value={customTitle}
              maxLength={64}
              onChange={(event) => setCustomTitle(event.target.value)}
            />
          </Field>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="primary" type="submit" disabled={pending || (mode === "edit" && !hasAnyEditPermission)}>
          {pending ? "保存中…" : mode === "create" ? "创建用户" : "保存修改"}
        </Button>
        <Link
          href="/staff/users"
          className="inline-flex h-10 items-center rounded-sm border border-line bg-surface-1 px-4 text-sm text-fg-1 transition-colors hover:border-line-strong hover:text-fg-0"
        >
          取消
        </Link>
      </div>
    </form>
  );
}
