"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LoginResponse, SiteRegistration } from "@kyokkou/contracts";
import { ApiClientError, apiPost } from "@/lib/api/client";
import { Button } from "./ui/button";
import { Field, Input } from "./ui/field";

/** 登录表单：真实调用 /api/v1/auth/login，失败展示 problem+json 文案。 */
export function LoginForm({
  next,
  registration,
}: {
  next: string;
  registration: SiteRegistration | null;
}) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      await apiPost<LoginResponse>("/api/v1/auth/login", { username, password });
      router.replace(next);
      router.refresh();
    } catch (loginError) {
      if (loginError instanceof ApiClientError) {
        setError(loginError.fields?.[0]?.message ?? loginError.message);
      } else {
        setError("登录失败，请稍后重试");
      }
      setPending(false);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">登录</h1>
      <p className="mt-1.5 text-sm text-fg-1">
        使用站点账号登录。启用两步验证后还需要输入动态验证码。
      </p>

      <form onSubmit={onSubmit} className="mt-6 grid gap-4" noValidate>
        <Field label="用户名或邮箱" htmlFor="username">
          <Input
            id="username"
            name="username"
            autoComplete="username"
            autoFocus
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="lightbringer"
          />
        </Field>

        <Field label="密码" htmlFor="password">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
          />
        </Field>

        {error && (
          <p
            role="alert"
            className="rounded-sm border border-danger/35 bg-danger/10 px-3 py-2 text-xs leading-relaxed text-danger"
          >
            {error}
          </p>
        )}

        <Button variant="primary" size="lg" type="submit" className="w-full" disabled={pending}>
          {pending ? "登录中…" : "登录"}
        </Button>

        <p className="text-center text-xs leading-relaxed text-fg-2">
          {registration?.open
            ? "注册已开放；注册页面将在后续纵切接入，当前可使用 seed 账号登录。"
            : (registration?.closed_message ?? "登录信息仅用于本站。")}
        </p>
      </form>
    </>
  );
}
