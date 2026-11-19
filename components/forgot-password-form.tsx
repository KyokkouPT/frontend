"use client";

import { useState } from "react";
import Link from "next/link";
import type { PasswordResetRequestResponse } from "@kyokkou/contracts";
import { ApiClientError, apiPost } from "@/lib/api/client";
import { Button } from "./ui/button";
import { Field, Input } from "./ui/field";
import { Notice } from "./notice";

/** 密码找回请求。接口防枚举，因此无论输入是否存在都展示同一确认文案。 */
export function ForgotPasswordForm({ enabled }: { enabled: boolean }) {
  const [identifier, setIdentifier] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSent(null);
    try {
      const result = await apiPost<PasswordResetRequestResponse>(
        "/api/v1/auth/password/request",
        { identifier },
      );
      setSent(result.message);
    } catch (caught) {
      setError(
        caught instanceof ApiClientError
          ? (caught.fields?.[0]?.message ?? caught.message)
          : "提交失败，请稍后重试",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">找回密码</h1>
      <p className="mt-1.5 text-sm text-fg-1">
        输入注册邮箱或用户名，我们会发送一封带重置链接的邮件。
      </p>

      {!enabled ? (
        <Notice tone="warn" className="mt-6">
          本站当前未开放密码找回，请联系管理员重置密码。
        </Notice>
      ) : sent ? (
        <div className="mt-6 grid gap-4">
          <Notice tone="info">{sent}</Notice>
          <p className="text-center text-xs text-fg-2">
            <Link href="/login" className="font-medium text-accent hover:underline">
              返回登录
            </Link>
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 grid gap-4" noValidate>
          <Field label="用户名或邮箱" htmlFor="reset-identifier">
            <Input
              id="reset-identifier"
              name="identifier"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              autoFocus
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="axue 或 axue@example.com"
            />
          </Field>

          {error && <Notice tone="warn">{error}</Notice>}

          <Button
            variant="primary"
            size="lg"
            type="submit"
            className="w-full"
            disabled={pending || identifier.trim().length === 0}
          >
            {pending ? "提交中…" : "发送重置邮件"}
          </Button>

          <p className="text-center text-xs text-fg-2">
            <Link href="/login" className="font-medium text-accent hover:underline">
              返回登录
            </Link>
          </p>
        </form>
      )}
    </>
  );
}