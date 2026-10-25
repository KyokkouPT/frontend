"use client";

import Link from "next/link";
import type { SiteIdentity, SiteNav } from "@kyokkou/contracts";
import { BrandMark } from "./brand-mark";
import { BackToTop } from "./back-to-top";
import { Badge } from "./ui/badge";
import { useBootstrap } from "./providers/bootstrap-provider";

/**
 * 全站页脚。数据来自 bootstrap.site.footer 与 bootstrap.nav；
 * AuthShell 在服务端直接传 site/nav（此时没有 bootstrap context）。
 */
export function SiteFooter({
  variant = "full",
  site: siteProp,
  nav: navProp,
}: {
  variant?: "full" | "compact";
  site?: SiteIdentity | null;
  nav?: SiteNav | null;
}) {
  const bootstrap = useBootstrap();
  const site = siteProp ?? bootstrap?.site ?? null;
  const nav = navProp ?? bootstrap?.nav ?? null;
  const name = site?.name ?? "KyokkouPT";
  const footer = site?.footer;
  const links = nav?.site.flatMap((group) => group.items) ?? [];

  if (variant === "compact") {
    return (
      <footer className="border-t border-line px-4 py-4 md:px-6">
        <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-fg-2">
          <span>{footer?.copyright ?? `© ${String(new Date().getFullYear())} ${name}`}</span>
          {footer?.icp && (
            <>
              <Dot />
              <span className="hidden sm:inline">{footer.icp}</span>
            </>
          )}
          <span className="ml-auto font-mono">{site?.version ?? ""}</span>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-10 border-t border-line">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-6">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_repeat(2,minmax(0,1fr))]">
          <div className="grid content-start gap-3">
            <Link href="/" className="flex w-fit items-center gap-2" aria-label={`${name} 首页`}>
              <BrandMark size={24} />
              <span className="text-base font-semibold tracking-[-0.01em]">{name}</span>
            </Link>
            <p className="max-w-[300px] text-xs leading-relaxed text-fg-2">
              {site?.tagline ?? "私有种子站引擎"}
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              {footer?.status && (
                <Badge tone="ok">
                  <span className="size-1.5 rounded-pill bg-ok" />
                  {footer.status}
                </Badge>
              )}
              {site?.version && <Badge mono>{site.version}</Badge>}
            </div>
          </div>

          <FooterNav title="站点" links={links.slice(0, 4)} />
          <FooterNav
            title="关于"
            links={[
              { href: "/", label: "首页" },
              { href: "/rules", label: "规则与 H&R" },
              { href: "/me", label: "我的概览" },
            ]}
          />
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line pt-4 text-2xs text-fg-2">
          <span>{footer?.copyright ?? `© ${String(new Date().getFullYear())} ${name}`}</span>
          {footer?.icp && (
            <>
              <Dot />
              <span>{footer.icp}</span>
            </>
          )}
          <BackToTop className="ml-auto" />
        </div>

        {footer?.disclaimer && (
          <p className="mt-2 max-w-[720px] text-2xs leading-relaxed text-fg-2">{footer.disclaimer}</p>
        )}
      </div>
    </footer>
  );
}

function FooterNav({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <nav aria-label={title} className="grid content-start gap-2">
      <p className="text-2xs font-semibold tracking-[0.08em] text-fg-2 uppercase">{title}</p>
      <ul className="grid gap-1.5">
        {links.map((link) => (
          <li key={`${title}-${link.href}`}>
            <Link href={link.href} className="text-[13px] text-fg-1 transition-colors hover:text-accent">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Dot() {
  return (
    <span aria-hidden className="text-fg-2/50">
      ·
    </span>
  );
}
