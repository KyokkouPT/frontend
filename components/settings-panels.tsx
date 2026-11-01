"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  MeSettingsResponse,
  PreferencesResponse,
  TwofaEnableResponse,
  TwofaSetupResponse,
} from "@kyokkou/contracts";
import { ApiClientError, apiFetch, apiPost } from "@/lib/api/client";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Field, Input } from "./ui/field";
import { Notice } from "./notice";
import { Panel } from "./ui/panel";

function errorText(error: unknown, fallback: string): string {
  if (error instanceof ApiClientError) return error.fields?.[0]?.message ?? error.message;
  return fallback;
}

export function AccountPanel({ settings }: { settings: MeSettingsResponse }) {
  const router = useRouter();
  const [twofaEnabled, setTwofaEnabled] = useState(settings.twofa_enabled);
  const [setup, setSetup] = useState<TwofaSetupResponse | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [twofaPassword, setTwofaPassword] = useState("");
  const [email, setEmail] = useState(settings.email);
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [passkey, setPasskey] = useState(settings.passkey);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  async function run(key: string, action: () => Promise<void>) {
    setPending(key);
    setError(null);
    setNotice(null);
    try {
      await action();
    } catch (caught) {
      setError(errorText(caught, "操作失败，请稍后重试"));
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="grid gap-6">
      {error && <Notice tone="warn">{error}</Notice>}
      {notice && <Notice tone="info">{notice}</Notice>}

      <Panel title="账号信息" description="passkey 用于 Tracker / RSS；轮换后旧链接立即失效">
        <dl className="grid gap-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <dt className="w-24 text-fg-2">用户名</dt>
            <dd className="font-medium">{settings.username}</dd>
            <Badge tone="default">{settings.role}</Badge>
            <Badge tone="accent">{settings.class.name}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <dt className="w-24 text-fg-2">passkey</dt>
            <dd className="min-w-0 flex-1 break-all font-mono text-xs">{passkey}</dd>
            <Button
              variant="default"
              disabled={pending !== null}
              onClick={() =>
                void run("passkey", async () => {
                  const result = await apiPost<{ passkey: string }>("/api/v1/me/passkey/rotate", {});
                  setPasskey(result.passkey);
                  setNotice("passkey 已轮换，请更新客户端里的 Tracker URL 与 RSS 地址");
                  router.refresh();
                })
              }
            >
              轮换 passkey
            </Button>
          </div>
        </dl>
      </Panel>

      <Panel
        title="双因素认证"
        description={
          twofaEnabled ? "已启用：登录需要动态码或恢复码（一次性）" : "未启用：建议开启以保护账号"
        }
      >
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={twofaEnabled ? "ok" : "warn"}>{twofaEnabled ? "已启用" : "未启用"}</Badge>
            {twofaEnabled && (
              <Button
                variant="default"
                disabled={pending !== null}
                onClick={() => setTwofaEnabled(false)}
              >
                停用
              </Button>
            )}
          </div>

          {!twofaEnabled && !setup && (
            <Field label="当前密码" htmlFor="twofa-password">
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  id="twofa-password"
                  type="password"
                  autoComplete="current-password"
                  value={twofaPassword}
                  onChange={(event) => setTwofaPassword(event.target.value)}
                />
                <Button
                  variant="primary"
                  disabled={pending !== null || twofaPassword.length === 0}
                  onClick={() =>
                    void run("setup", async () => {
                      const result = await apiPost<TwofaSetupResponse>("/api/v1/me/2fa/setup", {
                        password: twofaPassword,
                      });
                      setSetup(result);
                      setTwofaPassword("");
                    })
                  }
                >
                  生成 secret
                </Button>
              </div>
            </Field>
          )}

          {setup && (
            <div className="grid gap-3 rounded-md border border-line bg-surface-2 p-3">
              <p className="text-xs leading-relaxed text-fg-1">
                在认证器里添加账号（或手动输入 secret），然后输入动态码完成启用。
              </p>
              <code className="break-all rounded-sm bg-surface-1 px-2 py-1.5 font-mono text-xs">
                {setup.secret}
              </code>
              <code className="break-all rounded-sm bg-surface-1 px-2 py-1.5 font-mono text-2xs text-fg-2">
                {setup.otpauth_url}
              </code>
              <Field label="6 位动态码" htmlFor="twofa-code">
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    id="twofa-code"
                    inputMode="numeric"
                    maxLength={6}
                    value={totpCode}
                    onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, ""))}
                  />
                  <Button
                    variant="primary"
                    disabled={pending !== null || totpCode.length !== 6}
                    onClick={() =>
                      void run("enable", async () => {
                        const result = await apiPost<TwofaEnableResponse>(
                          "/api/v1/me/2fa/enable",
                          { code: totpCode },
                        );
                        setCodes(result.recovery_codes);
                        setSetup(null);
                        setTotpCode("");
                        setTwofaEnabled(true);
                        setNotice("2FA 已启用，请立即保存恢复码");
                        router.refresh();
                      })
                    }
                  >
                    启用 2FA
                  </Button>
                </div>
              </Field>
            </div>
          )}

          {codes && (
            <div className="grid gap-2 rounded-md border border-accent/35 bg-accent/8 p-3">
              <p className="text-xs font-semibold text-accent">恢复码（只显示一次，请妥善保存）</p>
              <ul className="grid grid-cols-2 gap-1 font-mono text-xs">
                {codes.map((code) => (
                  <li key={code}>{code}</li>
                ))}
              </ul>
            </div>
          )}

          {twofaEnabled && (
            <div className="grid gap-2">
              <Field label="当前密码（重新生成恢复码 / 停用）" htmlFor="twofa-password-manage">
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    id="twofa-password-manage"
                    type="password"
                    autoComplete="current-password"
                    value={twofaPassword}
                    onChange={(event) => setTwofaPassword(event.target.value)}
                  />
                  <Button
                    variant="default"
                    disabled={pending !== null || twofaPassword.length === 0}
                    onClick={() =>
                      void run("recovery", async () => {
                        const result = await apiPost<TwofaEnableResponse>(
                          "/api/v1/me/2fa/recovery-codes",
                          { password: twofaPassword },
                        );
                        setCodes(result.recovery_codes);
                        setNotice("已生成新的恢复码，旧恢复码全部失效");
                      })
                    }
                  >
                    重新生成恢复码
                  </Button>
                  <Button
                    variant="default"
                    disabled={pending !== null || twofaPassword.length === 0}
                    onClick={() =>
                      void run("disable", async () => {
                        await apiPost("/api/v1/me/2fa/disable", { password: twofaPassword });
                        setTwofaEnabled(false);
                        setCodes(null);
                        setTwofaPassword("");
                        setNotice("2FA 已停用");
                        router.refresh();
                      })
                    }
                  >
                    停用 2FA
                  </Button>
                </div>
              </Field>
            </div>
          )}
        </div>
      </Panel>

      <Panel title="邮箱与密码">
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void run("profile", async () => {
              await apiFetch("/api/v1/me/settings", {
                method: "PUT",
                body: JSON.stringify({ email }),
              });
              setNotice("邮箱已更新");
              router.refresh();
            });
          }}
        >
          <Field label="邮箱" htmlFor="settings-email">
            <Input
              id="settings-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Button variant="default" type="submit" disabled={pending !== null}>
            保存邮箱
          </Button>
        </form>

        <form
          className="mt-4 grid gap-3 border-t border-line pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            void run("password", async () => {
              await apiFetch("/api/v1/me/settings", {
                method: "PUT",
                body: JSON.stringify({ password: newPassword, current_password: currentPassword }),
              });
              window.location.assign("/login?password_changed=1");
            });
          }}
        >
          <Field label="当前密码" htmlFor="settings-current-password">
            <Input
              id="settings-current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </Field>
          <Field label="新密码" htmlFor="settings-new-password" hint="至少 8 位；修改后所有会话失效">
            <Input
              id="settings-new-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </Field>
          <Button
            variant="primary"
            type="submit"
            disabled={pending !== null || currentPassword.length === 0 || newPassword.length < 8}
          >
            修改密码
          </Button>
        </form>
      </Panel>
    </div>
  );
}

export function PreferencesPanel({ initial }: { initial: PreferencesResponse }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const items: { key: keyof PreferencesResponse; label: string; hint: string }[] = [
    { key: "email_review", label: "审核结果邮件", hint: "种子通过/驳回时通知" },
    { key: "email_hnr", label: "H&R 提醒邮件", hint: "保种义务即将到期时通知" },
    { key: "email_invite", label: "邀请邮件", hint: "邀请码被使用时通知" },
    { key: "email_social", label: "社交邮件", hint: "回复/提及等通知" },
    { key: "email_weekly", label: "每周摘要", hint: "站点周报" },
    { key: "public_seeding", label: "公开做种数", hint: "在用户主页显示做种数量" },
    { key: "public_published", label: "公开最近发布", hint: "在用户主页显示最近发布的种子" },
    { key: "searchable", label: "允许被搜索", hint: "出现在用户搜索结果中" },
  ];

  return (
    <Panel title="通知与隐私" description="偏好立即生效；邮件在配置 SMTP 后发送">
      {message && <Notice tone="info">{message}</Notice>}
      {error && <Notice tone="warn">{error}</Notice>}
      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.key} className="rounded-md border border-line bg-surface-1 p-3">
            <label className="flex cursor-pointer items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={values[item.key]}
                onChange={(event) =>
                  setValues((previous) => ({ ...previous, [item.key]: event.target.checked }))
                }
                className="mt-0.5 size-[15px] accent-accent"
              />
              <span>
                <b className="font-medium">{item.label}</b>
                <span className="mt-0.5 block text-2xs text-fg-2">{item.hint}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
      <div className="mt-3">
        <Button
          variant="primary"
          disabled={pending}
          onClick={async () => {
            setPending(true);
            setError(null);
            setMessage(null);
            try {
              const updated = await apiFetch<PreferencesResponse>("/api/v1/me/preferences", {
                method: "PUT",
                body: JSON.stringify(values),
              });
              setValues(updated);
              setMessage("偏好已保存");
              router.refresh();
            } catch (caught) {
              setError(errorText(caught, "保存失败"));
            } finally {
              setPending(false);
            }
          }}
        >
          保存偏好
        </Button>
      </div>
    </Panel>
  );
}
