"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { DownloadRulesResponse } from "@kyokkou/contracts";
import { ApiClientError, apiFetch } from "@/lib/api/client";

/** Recheck at click time; the backend remains authoritative for every download. */
export function DownloadLink({ href, children, className, label, enabled = true }: {
  href: string; children: ReactNode; className?: string; label?: string; enabled?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return <>
    <a href={href} className={className} aria-label={label} aria-busy={pending} onClick={(event) => {
      if (!enabled || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if (pending) return;
      setPending(true); setError(null);
      void apiFetch<DownloadRulesResponse>("/api/v1/download-rules").then((rules) => {
        if (rules.required) router.push("/download-rules");
        else window.location.assign(href);
      }).catch((caught: unknown) => {
        // Independent frontend rollout may precede the new API. The download
        // endpoint still enforces rules whenever the backend supports them.
        if (caught instanceof ApiClientError && caught.status === 404) window.location.assign(href);
        else setError(caught instanceof ApiClientError ? caught.message : "无法检查下载规则，请重试");
      })
        .finally(() => setPending(false));
    }}>{children}</a>
    {error && <span role="alert" className="text-xs text-warn">{error}</span>}
  </>;
}
