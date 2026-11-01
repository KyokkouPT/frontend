"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LoginResponse, SiteRegistration } from "@kyokkou/contracts";
import { ApiClientError, apiPost } from "@/lib/api/client";
import { Button } from "./ui/button";
import { Field, Input } from "./ui/field";
import { Markdown } from "./markdown";

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
  const [totpCode, setTotpCode] = useState("");
  const [captchaCode, setCaptchaCode] = useState("");
  const [captchaVersion, setCaptchaVersion] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function refreshCaptcha(): void {
    setCaptchaVersion(Date.now());
    setCaptchaCode("");
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      await apiPost<LoginResponse>("/api/v1/auth/login", {
        username,
        password,
        captcha_code: captchaCode.trim().toUpperCase(),
        ...(totpCode.trim() ? { totp_code: totpCode.trim() } : {}),
      });
      router.replace(next);
      router.refresh();
    } catch (loginError) {
      if (loginError instanceof ApiClientError) {
        setError(loginError.fields?.[0]?.message ?? loginError.message);
      } else {
        setError("登录失败，请稍后重试");
      }
      refreshCaptcha();
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
            autoCapitalize="none"
            spellCheck={false}
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

        <Field label="图形验证码" htmlFor="captcha_code" required hint="看不清可点击图片刷新">
          <div className="flex items-center gap-2">
            <img
              key={captchaVersion}
              src={`/api/v1/auth/captcha?t=${String(captchaVersion)}`}
              alt="图形验证码"
              width={150}
              height={44}
              className="h-11 w-[150px] rounded-sm border border-line bg-surface-0"
            />
            <button
              type="button"
              className="inline-flex h-9 items-center rounded-sm border border-line bg-surface-1 px-2.5 text-xs text-fg-1 hover:border-line-strong hover:text-fg-0"
              onClick={refreshCaptcha}
            >
              刷新
            </button>
            <Input
              id="captcha_code"
              name="captcha_code"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              required
              maxLength={8}
              value={captchaCode}
              onChange={(event) => setCaptchaCode(event.target.value.toUpperCase())}
              placeholder="输入图中字符"
              className="flex-1"
            />
          </div>
        </Field>

        <Field label="两步验证码" htmlFor="totp_code" hint="未启用 2FA 可留空">
          <Input
            id="totp_code"
            name="totp_code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={totpCode}
            onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, ""))}
            placeholder="6 位数字"
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

        {registration?.open || registration?.invite_registration_enabled ? (
          <p className="text-center text-xs leading-relaxed text-fg-2">
            还没有账号？{" "}
            <Link href="/signup" className="font-medium text-accent hover:underline">
              使用邀请码注册
            </Link>
          </p>
        ) : (
          <Markdown className="text-center text-xs">
            {registration?.closed_message ?? "登录信息仅用于本站。"}
          </Markdown>
        )}
      </form>
    </>
  );
}
