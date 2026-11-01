"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eraser } from "lucide-react";
import { ApiClientError, apiPost } from "@/lib/api/client";

export function HnrClearButton({
  obligationId,
  credits,
}: {
  obligationId: number;
  credits: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function clear(): Promise<void> {
    if (pending || credits <= 0) return;
    setPending(true);
    setError(null);
    try {
      await apiPost(`/api/v1/me/hnr/${String(obligationId)}/clear`, {});
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "清除失败");
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="ml-auto inline-flex items-center gap-1">
      {error && <span className="max-w-40 truncate text-2xs text-danger">{error}</span>}
      <button
        type="button"
        className="inline-flex size-7 items-center justify-center rounded-sm border border-line text-fg-1 transition-colors hover:border-line-strong hover:bg-surface-2 hover:text-fg-0 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={pending || credits <= 0}
        onClick={() => void clear()}
        aria-label={credits > 0 ? `清除这条 H&R，剩余 ${String(credits)} 次机会` : "没有 H&R 清除机会"}
        title={credits > 0 ? `清除 H&R（剩余 ${String(credits)} 次）` : "没有 H&R 清除机会"}
      >
        <Eraser className="size-4" />
      </button>
      <span className="font-mono text-2xs text-fg-2">{credits}</span>
    </span>
  );
}
