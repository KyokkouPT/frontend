"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { StaffUserItem } from "@kyokkou/contracts";
import { ApiClientError, apiFetch, apiPost } from "@/lib/api/client";
import { Button } from "./ui/button";
import { Field, Input, Select } from "./ui/field";
import { Notice } from "./notice";

function errorText(error: unknown, fallback: string): string {
  return error instanceof ApiClientError ? (error.fields?.[0]?.message ?? error.message) : fallback;
}

/** 新建与编辑共用同一个用户表单布局。 */
export function UserForm({ mode, user }: { mode: "create" | "edit"; user?: StaffUserItem }) {
  const router = useRouter();
  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(user?.role ?? "user");
  const [classKey, setClassKey] = useState(user?.class_key ?? "user");
  const [status, setStatus] = useState(user?.status ?? "active");
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
          role,
          class_key: classKey.trim(),
        });
      } else if (user) {
        await apiFetch(`/api/v1/staff/users/${String(user.id)}`, {
          method: "PUT",
          body: JSON.stringify({
            email: email.trim(),
            role,
            class_key: classKey.trim(),
            status,
            ...(password ? { password } : {}),
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

        <Field label="角色" htmlFor="user-role">
          <Select id="user-role" value={role} onChange={(event) => setRole(event.target.value as typeof role)}>
            <option value="user">用户</option>
            <option value="moderator">版主</option>
            <option value="admin">管理员</option>
          </Select>
        </Field>

        <Field label="权限组（class_key）" htmlFor="user-class" hint="显示用等级标识">
          <Input
            id="user-class"
            value={classKey}
            onChange={(event) => setClassKey(event.target.value)}
          />
        </Field>

        {mode === "edit" && (
          <Field label="状态" htmlFor="user-status">
            <Select id="user-status" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
              <option value="active">正常</option>
              <option value="suspended">停用</option>
              <option value="banned">封禁</option>
            </Select>
          </Field>
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
