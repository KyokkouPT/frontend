"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ResendVerificationResponse } from "@kyokkou/contracts";
import { ApiClientError, apiPost } from "@/lib/api/client";
import { Button } from "./ui/button";
import { Field, Input } from "./ui/field";
import { Notice } from "./notice";

type State = "verifying" | "ok" | "invalid";

/** token → 校验 Promise（成功返回用户名，失败返回 null）；跨 StrictMode 重复挂载复用。 */
const inflight = new Map<string, Promise<string | null>>();

function verifyOnce(token: string): Promise<string | null> {
  const existing = inflight.get(token);
  if (existing) return existing;
  const promise = apiPost<{ ok: true; username: string }>("/api/v1/auth/verify-email", { token })
    .then((result) => result.username)
    .catch(() => null);
  inflight.set(token, promise);
  return promise;
}

/** 邮箱验证落地页：自动消费 token；失败时可直接重发验证邮件。 */
export function VerifyEmailPanel({ token }: { token: string }) {
  const [state, setState] = useState<State>(token ? "verifying" : "invalid");
  const [username, setUsername] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [resent, setResent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    // React StrictMode 会重复挂载 effect；token 一次性，两次请求会让第二次误判失效。
    // 用模块级 Promise 共享同一次校验结果。
    void verifyOnce(token).then((outcome) => {
      if (!alive) return;
      if (outcome) {
        setUsername(outcome);
        setIdentifier(outcome);
        setState("ok");
      } else {
        setState("invalid");
      }
    });
    return () => {
      alive = false;
    };
  }, [token]);

  async function resend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setResent(null);
    try {
      const result = await apiPost<ResendVerificationResponse>(
        "/api/v1/auth/verify-email/resend",
        { identifier },
      );
      setResent(result.message);
    } catch (caught) {
      setError(
        caught instanceof ApiClientError
          ? (caught.fields?.[0]?.message ?? caught.message)
          : "重发失败，请稍后重试",
      );
    } finally {
      setPending(false);
    }
  }

  if (state === "verifying") {
    return (
      <>
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">正在验证邮箱</h1>
        <p className="mt-1.5 text-sm text-fg-1">请稍候，正在校验验证链接…</p>
      </>
    );
  }

  if (state === "ok") {
    return (
      <>
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">邮箱验证成功</h1>
        <Notice tone="info" className="mt-6">
          账号 {username} 的邮箱已验证，现在可以登录了。
        </Notice>
        <Link
          href="/login"
          className="mt-4 block text-center text-sm font-medium text-accent hover:underline"
        >
          去登录
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">验证链接无效</h1>
      <p className="mt-1.5 text-sm text-fg-1">
        链接可能已过期或已被使用。可以重新发送一封验证邮件。
      </p>

      <form onSubmit={resend} className="mt-6 grid gap-4" noValidate>
        <Field label="用户名或邮箱" htmlFor="resend-identifier">
          <Input
            id="resend-identifier"
            name="identifier"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
          />
        </Field>

        {error && <Notice tone="warn">{error}</Notice>}
        {resent && <Notice tone="info">{resent}</Notice>}

        <Button
          variant="primary"
          size="lg"
          type="submit"
          className="w-full"
          disabled={pending || identifier.trim().length === 0}
        >
          {pending ? "发送中…" : "重新发送验证邮件"}
        </Button>

        <p className="text-center text-xs text-fg-2">
          <Link href="/login" className="font-medium text-accent hover:underline">
            返回登录
          </Link>
        </p>
      </form>
    </>
  );
}
