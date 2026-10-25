import Link from "next/link";
import type { ReactNode } from "react";
import type { SiteIdentity } from "@kyokkou/contracts";
import { ThemeSwitch } from "./theme-switch";
import { BrandMark } from "./brand-mark";
import { SiteFooter } from "./site-footer";

/**
 * 登录/注册等认证页的分栏布局：左侧品牌，右侧表单。
 * site 来自 bootstrap；后端不可用时用中性 fallback，不伪造数据。
 */
export function AuthShell({ site, children }: { site: SiteIdentity | null; children: ReactNode }) {
  const name = site?.name ?? "KyokkouPT";
  const tagline = site?.tagline ?? "私有种子站引擎";

  return (
    <div className="flex min-h-screen flex-col">
      <div className="grid flex-1 lg:grid-cols-2">
        <div className="relative hidden flex-col justify-between overflow-hidden border-r border-line bg-surface-1 p-10 lg:flex">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(520px 360px at 18% 12%, var(--color-accent) 0%, transparent 62%), radial-gradient(460px 320px at 88% 78%, var(--color-accent-2) 0%, transparent 60%)",
              opacity: 0.09,
            }}
          />
          <Link href="/" className="relative flex items-center gap-2.5" aria-label={`${name} 首页`}>
            <BrandMark size={32} />
            <span className="text-lg font-semibold tracking-[-0.01em]">{name}</span>
          </Link>

          <div className="relative max-w-[420px]">
            <h2 className="text-2xl leading-snug font-semibold tracking-[-0.02em]">
              {tagline}
              <br />
              规则、账本与保种义务都说得清楚。
            </h2>
            <ul className="mt-6 grid gap-3 text-sm text-fg-1">
              {[
                "分区、字段与审核口径由站点配置驱动",
                "分享率、H&R、魔力值——每次变动都有账本",
                "一个账号、一个 passkey，Tracker 与站点同源",
              ].map((line) => (
                <li key={line} className="flex gap-2.5">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-pill bg-accent" />
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <p className="relative text-xs text-fg-2">
            使用站点账号登录；账号由管理员或邀请注册创建。
          </p>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center justify-between p-4 lg:justify-end">
            <Link href="/" className="text-sm text-fg-1 hover:text-fg-0 lg:hidden">
              ← 返回站点
            </Link>
            <ThemeSwitch />
          </div>

          <div className="flex flex-1 items-center justify-center px-4 pb-12">
            <div className="w-full max-w-[380px]">{children}</div>
          </div>
        </div>
      </div>

      <SiteFooter variant="compact" site={site} />
    </div>
  );
}
