"use client";

import { useState } from "react";
import { Button } from "./ui/button";

export function RssCopy({ url }: { url: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("failed");
    }
  }

  return (
    <Button variant="default" onClick={() => void copy()}>
      {status === "copied" ? "已复制" : status === "failed" ? "复制失败，请手动选择" : "复制地址"}
    </Button>
  );
}
