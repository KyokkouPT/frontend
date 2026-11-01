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

function toGbText(bytes: number): string {
  return String(Math.round((bytes / GB) * 100) / 100);
}

function errorText(error: unknown, fallback: string): string {
  return error instanceof ApiClientError ? (error.fields?.[0]?.message ?? error.message) : fallback;
}

/** 新建与编辑共用同一个用户表单布局。 */
export function UserForm({
  mode,
  user,
  classes,
}: {
  mode: "create" | "edit";
  user?: StaffUserItem;
  classes: ClassOption[];
}) {
  const router = useRouter();
  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [classSlug, setClassSlug] = useState(user?.class.slug ?? classes.find((item) => item.slug === "user")?.slug ?? "user");
  const [status, setStatus] = useState(user?.status ?? "active");
  const [uploadedGb, setUploadedGb] = useState(user ? toGbText(user.uploaded) : "0");
  const [downloadedGb, setDownloadedGb] = useState(user ? toGbText(user.downloaded) : "0");
  const [bonus, setBonus] = useState(user ? String(user.bonus) : "0");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        const nextUploaded = Math.floor(Number(uploadedGb) * GB);
        const nextDownloaded = Math.floor(Number(downloadedGb) * GB);
        const nextBonus = Math.floor(Number(bonus));
        await apiFetch(`/api/v1/staff/users/${String(user.id)}`, {
          method: "PUT",
          body: JSON.stringify({
            email: email.trim(),
            class_slug: classSlug,
            status,
            ...(password ? { password } : {}),
            ...(Number.isFinite(nextUploaded) && toGbText(nextUploaded) !== toGbText(user.uploaded)
              ? { uploaded: nextUploaded }
              : {}),
            ...(Number.isFinite(nextDownloaded) && toGbText(nextDownloaded) !== toGbText(user.downloaded)
              ? { downloaded: nextDownloaded }
              : {}),
            ...(Number.isFinite(nextBonus) && nextBonus !== user.bonus ? { bonus: nextBonus } : {}),
          }),
        });
      }
      router.push("/staff/users");
      router.refresh();
    } catch (caught) {
      setError(errorText(caught, mode === "create" ? "创建用户失败" : "保存失败"));
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-lg border border-line bg-surface-1 p-5">
      {error && <Notice tone="warn">{error}</Notice>}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="用户名" htmlFor="user-username" required hint={mode === "edit" ? "用户名不可修改" : undefined}>
          <Input
            id="user-username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required={mode === "create"}
            disabled={mode === "edit"}
          />
        </Field>

        <Field label="邮箱" htmlFor="user-email" required>
          <Input
            id="user-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </Field>

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

        <Field label="等级" htmlFor="user-class" hint="只能授予 rank 低于自己的等级">
          <Select id="user-class" value={classSlug} onChange={(event) => setClassSlug(event.target.value)}>
            {classes.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}（{item.slug}，rank {item.rank}）
              </option>
            ))}
          </Select>
        </Field>

        {mode === "edit" && (
          <>
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

            <Field label="魔力值" htmlFor="user-bonus" hint="整数；调整会写入魔力账本">
              <Input
                id="user-bonus"
                type="number"
                step="1"
                min="0"
                value={bonus}
                onChange={(event) => setBonus(event.target.value)}
              />
            </Field>

            <Field label="状态" htmlFor="user-status">
              <Select id="user-status" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
                <option value="active">正常</option>
                <option value="suspended">停用</option>
                <option value="banned">封禁</option>
              </Select>
            </Field>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="primary" type="submit" disabled={pending}>
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
