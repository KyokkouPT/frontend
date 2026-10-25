"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SetupResponse } from "@kyokkou/contracts";
import { ApiClientError, apiPost } from "@/lib/api/client";
import { Button } from "./ui/button";
import { Field, Input } from "./ui/field";
import { Notice } from "./notice";

export function SetupWizard() {
  const router = useRouter();
  const [siteName, setSiteName] = useState("KyokkouPT");
  const [tagline, setTagline] = useState("");
  const [adminUsername, setAdminUsername] = useState("admin");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [baseSections, setBaseSections] = useState(true);
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (adminPassword !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setPending(true);
    try {
      await apiPost<SetupResponse>("/api/v1/setup", {
        site_name: siteName.trim(),
        site_tagline: tagline.trim() || undefined,
        locale: "zh-CN",
        admin_username: adminUsername.trim(),
        admin_email: adminEmail.trim(),
        admin_password: adminPassword,
        base_sections: baseSections,
        registration_open: registrationOpen,
      });
      router.replace("/");
      router.refresh();
    } catch (setupError) {
      setError(
        setupError instanceof ApiClientError
          ? (setupError.fields?.[0]?.message ?? setupError.message)
          : "安装失败，请稍后重试",
      );
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-4 rounded-lg border border-line bg-surface-1 p-5 shadow-sm"
      noValidate
    >
      <Field label="站点名称" htmlFor="setup-site-name" required>
        <Input
          id="setup-site-name"
          value={siteName}
          onChange={(event) => setSiteName(event.target.value)}
          required
          maxLength={64}
        />
      </Field>

      <Field label="副标题" htmlFor="setup-tagline" hint="可留空">
        <Input
          id="setup-tagline"
          value={tagline}
          onChange={(event) => setTagline(event.target.value)}
          maxLength={160}
          placeholder="通用、可配置、可自部署的私有种子站引擎"
        />
      </Field>

      <div className="border-t border-line pt-4">
        <p className="mb-3 text-sm font-semibold">第一个管理员账号</p>
        <div className="grid gap-3">
          <Field label="用户名" htmlFor="setup-admin-username" required>
            <Input
              id="setup-admin-username"
              autoComplete="username"
              value={adminUsername}
              onChange={(event) => setAdminUsername(event.target.value)}
              required
              minLength={2}
              maxLength={64}
            />
          </Field>

          <Field label="邮箱" htmlFor="setup-admin-email" required>
            <Input
              id="setup-admin-email"
              type="email"
              autoComplete="email"
              value={adminEmail}
              onChange={(event) => setAdminEmail(event.target.value)}
              required
            />
          </Field>

          <Field label="密码" htmlFor="setup-admin-password" required hint="至少 8 位">
            <Input
              id="setup-admin-password"
              type="password"
              autoComplete="new-password"
              value={adminPassword}
              onChange={(event) => setAdminPassword(event.target.value)}
              required
              minLength={8}
            />
          </Field>

          <Field label="确认密码" htmlFor="setup-admin-password-confirm" required>
            <Input
              id="setup-admin-password-confirm"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={8}
            />
          </Field>
        </div>
      </div>

      <div className="grid gap-2 border-t border-line pt-4">
        <label className="flex cursor-pointer items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={baseSections}
            onChange={(event) => setBaseSections(event.target.checked)}
            className="mt-0.5 size-[15px] accent-accent"
          />
          <span>
            导入基础分区模板
            <span className="mt-0.5 block text-2xs text-fg-2">
              影视/游戏/音乐/书籍/软件/学习 共 6 个分区；只含配置，不含演示种子
            </span>
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={registrationOpen}
            onChange={(event) => setRegistrationOpen(event.target.checked)}
            className="mt-0.5 size-[15px] accent-accent"
          />
          <span>
            开放注册
            <span className="mt-0.5 block text-2xs text-fg-2">
              关闭后只能邀请注册；安装后可在 Staff → 站点设置 修改
            </span>
          </span>
        </label>
      </div>

      {error && <Notice tone="warn">{error}</Notice>}

      <Button variant="primary" size="lg" type="submit" disabled={pending}>
        {pending ? "安装中…" : "完成安装并登录"}
      </Button>

      <p className="text-center text-2xs leading-relaxed text-fg-2">
        安装完成后会自动以管理员身份登录；数据库已有用户时不会出现此页面。
      </p>
    </form>
  );
}
