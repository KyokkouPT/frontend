"use client";

import { useState } from "react";
import Link from "next/link";
import { ApiClientError, apiPost } from "@/lib/api/client";
import { Button } from "./ui/button";
import { Field, Input, Textarea } from "./ui/field";
import { Notice } from "./notice";

export function PublicAppealForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);

  if (submitted) {
    return (
      <div className="grid gap-3">
        <Notice tone="info">申诉已提交。Staff 处理后会在账号恢复后看到处理结果。</Notice>
        <p className="text-sm text-fg-2">
          返回{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            登录页
          </Link>
        </p>
      </div>
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await apiPost("/api/v1/appeals/public", {
        username: username.trim(),
        email: email.trim(),
        password,
        reason: reason.trim(),
      });
      setSubmitted(true);
    } catch (caught) {
      setError(
        caught instanceof ApiClientError
          ? (caught.fields?.[0]?.message ?? caught.message)
          : "提交失败，请稍后重试",
      );
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <Field label="用户名" htmlFor="appeal-username" required>
        <Input
          id="appeal-username"
          autoComplete="username"
          required
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
      </Field>
      <Field label="注册邮箱" htmlFor="appeal-email" required>
        <Input
          id="appeal-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </Field>
      <Field label="密码" htmlFor="appeal-password" required hint="用于验证账号归属，不会保存">
        <Input
          id="appeal-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </Field>
      <Field label="申诉说明" htmlFor="appeal-reason" required hint="至少 10 个字">
        <Textarea
          id="appeal-reason"
          required
          minLength={10}
          maxLength={2000}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="说明封禁前后的情况，或提供可核实的证据。"
        />
      </Field>
      {error && <Notice tone="warn">{error}</Notice>}
      <Button variant="primary" size="lg" type="submit" disabled={pending}>
        {pending ? "提交中…" : "提交申诉"}
      </Button>
      <p className="text-xs text-fg-2">
        账号状态正常时不需要申诉；如已恢复，直接{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          登录
        </Link>
        。
      </p>
    </form>
  );
}
