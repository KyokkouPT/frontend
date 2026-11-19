"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiClientError, apiPost } from "@/lib/api/client";
import { Button } from "./ui/button";
import { Field, Input } from "./ui/field";
import { Notice } from "./notice";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("密码至少需要 8 位");
      return;
    }
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setPending(true);
    try {
      await apiPost("/api/v1/auth/password/reset", {
        token,
        password,
        password_confirm: confirmPassword,
      });
      router.replace("/login?reset=success");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof ApiClientError
          ? (caught.fields?.[0]?.message ?? caught.message)
          : "重置失败，请重新申请链接",
      );
      setPending(false);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">设置新密码</h1>
      <p className="mt-1.5 text-sm text-fg-1">
        链接只能使用一次；提交后所有已登录设备都会退出。
      </p>

      {!token ? (
        <Notice tone="warn" className="mt-6">
          链接缺少重置 token，请重新申请找回密码。
        </Notice>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 grid gap-4" noValidate>
          <Field label="新密码" htmlFor="reset-new-password" hint="至少 8 位">
            <Input
              id="reset-new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              autoFocus
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
          <Field label="确认新密码" htmlFor="reset-confirm-password">
            <Input
              id="reset-confirm-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </Field>

          {error && <Notice tone="warn">{error}</Notice>}

          <Button
            variant="primary"
            size="lg"
            type="submit"
            className="w-full"
            disabled={pending}
          >
            {pending ? "提交中…" : "设置新密码"}
          </Button>
        </form>
      )}

      <p className="mt-4 text-center text-xs text-fg-2">
        <Link href="/forgot-password" className="font-medium text-accent hover:underline">
          重新申请链接
        </Link>
      </p>
    </>
  );
}