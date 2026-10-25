"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main" className="grid min-h-dvh place-items-center p-4">
      <div className="w-full max-w-md rounded-md border border-line bg-surface-1 p-6">
        <h1 className="text-lg font-semibold">页面加载失败</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-fg-1">
          {error.message || "发生了未知错误，请稍后重试。"}
        </p>
        <Button variant="primary" className="mt-4" onClick={reset}>
          重试
        </Button>
      </div>
    </main>
  );
}
