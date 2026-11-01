"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LoginResponse, SiteRegistration } from "@kyokkou/contracts";
import { ApiClientError, apiPost } from "@/lib/api/client";
import { Button } from "./ui/button";
import { Field, Input } from "./ui/field";
import { Markdown } from "./markdown";
import { Notice } from "./notice";

export function SignupForm({
  registration,
  inviteCode: initialInvite,
  boundEmail = null,
  boundUsername = null,
}: {
  registration: SiteRegistration | null;
  inviteCode: string;
  boundEmail?: string | null;
  boundUsername?: string | null;
}) {
  const router = useRouter();
  const [username, setUsername] = useState(boundUsername ?? "");
  const [email, setEmail] = useState(boundEmail ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteCode, setInviteCode] = useState(initialInvite);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const inviteLocked = initialInvite.trim().length > 0;
  const usernameLocked = Boolean(boundUsername);
  const emailLocked = Boolean(boundEmail);

  if (registration) {
    const closedMode = registration.closed_registration_mode ?? "auto";
    const hasInvite = initialInvite.trim().length > 0;
    const showForm =
      registration.open ||
      hasInvite ||
      closedMode === "form";
    if (!showForm) {
      return (
        <>
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">注册</h1>
          <Markdown className="mt-1.5 text-sm">{registration.closed_message}</Markdown>
          <p className="mt-4 text-sm text-fg-2">
            已有账号？{" "}
            <Link href="/login" className="font-medium text-accent hover:underline">
              去登录
            </Link>
          </p>
        </>
      );
    }
  }

  const submissionBlocked = Boolean(
    registration && !registration.open && !registration.invite_registration_enabled,
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!rulesAccepted) {
      setError("请先阅读并同意站点规则");
      return;
    }
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
      await apiPost<LoginResponse>("/api/v1/auth/signup", {
        username,
        email,
        password,
        password_confirm: confirmPassword,
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
          : registration?.invite_registration_enabled
            ? "当前为邀请注册，请填写有效的邀请码。"
            : "站点当前关闭注册，仅展示注册表单。"}
      </p>

      {submissionBlocked && (
        <Notice tone="warn" className="mt-4">
          站点当前关闭注册且未开放邀请注册，提交将被拒绝。请等待开放或联系管理员获取邀请码。
        </Notice>
      )}

      <form onSubmit={onSubmit} className="mt-6 grid gap-4" noValidate>
        <Field
          label="用户名"
          htmlFor="signup-username"
          required
          hint={
            usernameLocked
              ? "该用户名由邀请码预注册，不能修改"
              : "3–32 位，小写字母/数字/下划线/连字符"
          }
        >
          <Input
            id="signup-username"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            minLength={3}
            maxLength={32}
            readOnly={usernameLocked}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </Field>

        <Field
          label="邮箱"
          htmlFor="signup-email"
          required
          hint={emailLocked ? "该邮箱由邀请码预注册，不能修改" : undefined}
        >
          <Input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            readOnly={emailLocked}
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

        <Field label="确认密码" htmlFor="signup-password-confirm" required hint="再次输入相同密码">
          <Input
            id="signup-password-confirm"
            name="password_confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </Field>

        <Field
          label="邀请码"
          htmlFor="signup-invite"
          hint={inviteLocked ? "邀请码来自当前注册链接，不能修改" : "开放注册时可留空"}
        >
          <Input
            id="signup-invite"
            name="invite_code"
            value={inviteCode}
            readOnly={inviteLocked}
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

        <Button variant="primary" size="lg" type="submit" className="w-full" disabled={pending || !rulesAccepted || submissionBlocked}>
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
