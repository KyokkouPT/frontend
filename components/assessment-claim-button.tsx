"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiClientError, apiPost } from "@/lib/api/client";
import { Button } from "./ui/button";

export function AssessmentClaimButton({ assessmentId }: { assessmentId: number }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function claim(): Promise<void> {
    setPending(true);
    setError(null);
    try {
      await apiPost(`/api/v1/me/assessments/${String(assessmentId)}/claim`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "领取失败，请稍后重试");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-1">
      <Button variant="primary" onClick={() => void claim()} disabled={pending}>
        {pending ? "领取中…" : "领取任务"}
      </Button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
