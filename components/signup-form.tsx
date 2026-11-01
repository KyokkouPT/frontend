"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LoginResponse, SiteRegistration } from "@kyokkou/contracts";
import { ApiClientError, apiPost } from "@/lib/api/client";
import { Button } from "./ui/button";
import { Field, Input } from "./ui/field";
import { Notice } from "./notice";

export function SignupForm({
  registration,
  inviteCode: initialInvite,
}: {
  registration: SiteRegistration | null;
  inviteCode: string;
}) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState(initialInvite);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (registration && !registration.open && !registration.invite_registration_enabled) {
    return (
      <>
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">注册</h1>
        <p className="mt-1.5 text-sm text-fg-1">{registration.closed_message}</p>
        <p className="mt-4 text-sm text-fg-2">
          已有账号？{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            去登录
          </Link>
        </p>
      </>
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!rulesAccepted) {
      setError("请先阅读并同意站点规则");
      return;
    }

    setPending(true);
    try {
      await apiPost<LoginResponse>("/api/v1/auth/signup", {
        username,
        email,
        password,
        rules_accepted: true,
        ...(inviteCode.trim() ? { invite_code: inviteCode.trim() } : {}),
      });
      router.replace("/");
      router.refresh();
    } catch (signupError) {
      setError(
        signupError instanceof ApiClientError
          ? (signupError.fields?.[0]?.message ?? signupError.message)
          : "注册失败，请稍后重试",
      );
      setPending(false);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">注册</h1>
      <p className="mt-1.5 text-sm text-fg-1">
        {registration?.open
          ? "当前开放注册；填写邀请码可以绑定邀请人。"
          : "当前为邀请注册，请填写有效的邀请码。"}
      </p>

      <form onSubmit={onSubmit} className="mt-6 grid gap-4" noValidate>
        <Field label="用户名" htmlFor="signup-username" required hint="3–32 位，小写字母/数字/下划线/连字符">
          <Input
            id="signup-username"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            minLength={3}
            maxLength={32}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </Field>

        <Field label="邮箱" htmlFor="signup-email" required>
          <Input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>

        <Field label="密码" htmlFor="signup-password" required hint="至少 8 位">
          <Input
            id="signup-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>

        <Field label="邀请码" htmlFor="signup-invite" hint="开放注册时可留空">
          <Input
            id="signup-invite"
            name="invite_code"
            value={inviteCode}
            onChange={(event) => setInviteCode(event.target.value)}
            placeholder="KYKDEMO1"
          />
        </Field>

        <label className="flex cursor-pointer items-start gap-2 text-sm text-fg-1">
          <input
            type="checkbox"
            checked={rulesAccepted}
            onChange={(event) => setRulesAccepted(event.target.checked)}
            className="mt-0.5 size-[15px] accent-accent"
          />
          <span>我已阅读并同意站点规则（含 H&amp;R 与分享率要求）</span>
        </label>

        {error && <Notice tone="warn">{error}</Notice>}

        <Button variant="primary" size="lg" type="submit" className="w-full" disabled={pending || !rulesAccepted}>
          {pending ? "注册中…" : "注册并登录"}
        </Button>

        <p className="text-center text-xs text-fg-2">
          已有账号？{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            去登录
          </Link>
        </p>
      </form>
    </>
  );
}
