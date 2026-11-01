"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { StaffUserItem } from "@kyokkou/contracts";
import { Ban, CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { ApiClientError, apiFetch } from "@/lib/api/client";

const buttonClass =
  "grid size-8 place-items-center rounded-sm border border-line bg-surface-1 text-fg-1 transition-colors hover:border-line-strong hover:text-fg-0 disabled:opacity-50";

export function UserToolbox({ user }: { user: StaffUserItem }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleStatus() {
    setPending(true);
    setError(null);
    try {
      await apiFetch(`/api/v1/staff/users/${String(user.id)}/${user.status === "active" ? "suspend" : "restore"}`, {
        method: "POST",
        body: "{}",
      });
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "操作失败");
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (!window.confirm(`确定删除用户「${user.username}」？此操作不可恢复。`)) return;
    setPending(true);
    setError(null);
    try {
      await apiFetch(`/api/v1/staff/users/${String(user.id)}`, { method: "DELETE" });
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "删除失败");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <Link
          href={`/staff/users/${String(user.id)}`}
          title="编辑"
          aria-label={`编辑 ${user.username}`}
          className={buttonClass}
        >
          <Pencil className="size-4" />
        </Link>

        <button
          type="button"
          title={user.status === "active" ? "禁用" : "启用"}
          aria-label={`${user.status === "active" ? "禁用" : "启用"} ${user.username}`}
          onClick={() => void toggleStatus()}
          disabled={pending}
          className={buttonClass}
        >
          {user.status === "active" ? <Ban className="size-4" /> : <CheckCircle2 className="size-4" />}
        </button>

        <button
          type="button"
          title="删除"
          aria-label={`删除 ${user.username}`}
          onClick={() => void remove()}
          disabled={pending}
          className={`${buttonClass} hover:border-danger/50 hover:text-danger`}
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      {error && <span className="max-w-[220px] text-2xs leading-tight text-danger">{error}</span>}
    </div>
  );
}
