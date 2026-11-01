"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiClientError, apiFetch } from "@/lib/api/client";

export function ClassDeleteButton({ slug, name }: { slug: string; name: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove(): Promise<void> {
    if (!window.confirm(`确定删除等级「${name}」？有用户属于该等级时会被拒绝。`)) return;
    setPending(true);
    setError(null);
    try {
      await apiFetch(`/api/v1/staff/classes/${slug}`, { method: "DELETE" });
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "删除失败");
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => void remove()}
        disabled={pending}
        className="text-xs text-fg-2 underline decoration-line underline-offset-2 hover:text-danger disabled:opacity-50"
      >
        删除
      </button>
      {error && <span className="max-w-[220px] text-2xs text-danger">{error}</span>}
    </span>
  );
}
