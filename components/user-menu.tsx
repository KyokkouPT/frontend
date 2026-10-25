"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LayoutDashboard, LogOut, User } from "lucide-react";
import type { UserSummary } from "@kyokkou/contracts";
import { ApiClientError, apiPost } from "@/lib/api/client";
import { Avatar } from "./ui/avatar";
import { useBootstrap } from "./providers/bootstrap-provider";
import { cn } from "@/lib/cn";

const ROLE_LABEL: Record<UserSummary["role"], string> = {
  user: "用户",
  moderator: "版主",
  admin: "管理员",
};

/**
 * 顶栏账号入口：未登录是登录按钮，已登录是头像下拉。
 * 下拉键盘可达：↓ 打开并聚焦首项，↑↓ 移动，Esc 关闭并回焦，点击外部关闭。
 */
export function UserMenu() {
  const bootstrap = useBootstrap();
  const me = bootstrap?.me ?? null;
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      const items = Array.from(
        menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
      );
      const current = items.indexOf(document.activeElement as HTMLElement);

      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        btnRef.current?.focus();
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        items[(current + 1) % items.length]?.focus();
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        items[(current - 1 + items.length) % items.length]?.focus();
      }
      if (event.key === "Home") {
        event.preventDefault();
        items[0]?.focus();
      }
      if (event.key === "End") {
        event.preventDefault();
        items[items.length - 1]?.focus();
      }
    }

    function onPointerDown(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    }
  }, [open]);

  async function logout() {
    setPending(true);
    setError(null);
    try {
      await apiPost("/api/v1/auth/logout");
      setOpen(false);
      // 登出是认证边界：整页导航让 bootstrap 与所有 RSC 数据按未登录状态重建，
      // 避免 router.refresh() 时壳与页面内容短暂不一致。
      window.location.assign("/");
    } catch (logoutError) {
      setError(logoutError instanceof ApiClientError ? logoutError.message : "退出失败，请稍后重试");
    } finally {
      setPending(false);
    }
  }

  if (!me) {
    return (
      <Link
        href="/login"
        aria-label="登录"
        className="ml-1 flex h-10 items-center gap-1.5 rounded-pill border border-line bg-surface-1 px-2.5 text-sm text-fg-1 transition-colors hover:border-line-strong hover:bg-surface-2 hover:text-fg-0 md:h-[34px]"
      >
        <User className="size-4" />
        <span className="max-sm:hidden">登录</span>
      </Link>
    );
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="账号菜单"
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          "ml-1 flex h-10 items-center gap-2 rounded-pill border bg-surface-1 pr-2 pl-0.5 transition-colors md:h-[34px]",
          "hover:border-line-strong hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          open ? "border-line-strong bg-surface-2" : "border-line",
        )}
      >
        <Avatar name={me.username} hue={hashHue(me.username)} initial={me.username.slice(0, 1)} />
        <span className="grid leading-tight max-md:hidden">
          <b className="max-w-[120px] truncate text-xs font-semibold">{me.username}</b>
          <span className="text-[10px] tracking-[0.04em] text-accent">
            {ROLE_LABEL[me.role]} · {me.class_key}
          </span>
        </span>
        <ChevronDown
          className={cn("size-3.5 text-fg-2 transition-transform duration-150", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="账号菜单"
          className="absolute top-[calc(100%+8px)] right-0 z-[200] w-[240px] overflow-hidden rounded-md border border-line bg-surface-1 shadow-2xl"
        >
          <div className="flex items-center gap-2.5 border-b border-line px-3 py-3">
            <Avatar
              name={me.username}
              hue={hashHue(me.username)}
              initial={me.username.slice(0, 1)}
              size="lg"
            />
            <div className="min-w-0">
              <b className="block truncate text-[13px] font-semibold">{me.username}</b>
              <span className="block text-2xs text-fg-2">
                {ROLE_LABEL[me.role]} · {me.class_key}
              </span>
            </div>
          </div>

          <div className="p-1">
            <Link
              role="menuitem"
              href="/me"
              className="flex h-8 items-center gap-2.5 rounded-sm px-2 text-[13px] text-fg-1 outline-none transition-colors hover:bg-surface-2 hover:text-fg-0 focus-visible:bg-surface-2 focus-visible:text-fg-0"
            >
              <LayoutDashboard className="size-4 shrink-0 opacity-80" />
              个人概览
            </Link>
          </div>

          <div className="h-px bg-line" />

          <div className="p-1">
            <button
              role="menuitem"
              type="button"
              onClick={() => void logout()}
              disabled={pending}
              className="flex h-8 w-full items-center gap-2.5 rounded-sm px-2 text-[13px] text-fg-2 outline-none transition-colors hover:bg-danger/10 hover:text-danger focus-visible:bg-danger/10 focus-visible:text-danger disabled:opacity-60"
            >
              <LogOut className="size-4 shrink-0" />
              {pending ? "退出中…" : "退出登录"}
            </button>
          </div>

          {error && <p className="border-t border-line px-3 py-2 text-2xs text-danger">{error}</p>}
        </div>
      )}
    </div>
  );
}

/** 与后端 hueFor 一致：用户名稳定哈希到 0..359。 */
function hashHue(name: string): number {
  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + (char.codePointAt(0) ?? 0)) % 360;
  }
  return hash;
}
