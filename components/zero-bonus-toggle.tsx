"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiClientError, apiFetch } from "@/lib/api/client";
import { Notice } from "./notice";

export function ZeroBonusToggle({
  torrentId,
  initial,
}: {
  torrentId: number;
  initial: boolean;
}) {
  const router = useRouter();
  const [zeroBonus, setZeroBonus] = useState(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle(): Promise<void> {
    const next = !zeroBonus;
    setPending(true);
    setError(null);
    try {
      const result = await apiFetch<{ ok: boolean; zero_bonus: boolean }>(
        `/api/v1/torrents/${String(torrentId)}/zero-bonus`,
        {
          method: "PUT",
          body: JSON.stringify({ zero_bonus: next }),
        },
      );
      setZeroBonus(result.zero_bonus);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "修改失败");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-2">
      {error && <Notice tone="warn">{error}</Notice>}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={zeroBonus} disabled={pending} onChange={() => void toggle()} />
        零魔种子（做种魔力权重 0.2）
      </label>
    </div>
  );
}
