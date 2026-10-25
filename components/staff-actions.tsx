"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AnomalyItem, AppealItem, ReportItem, StaffUserItem } from "@kyokkou/contracts";
import { ApiClientError, apiPost } from "@/lib/api/client";
import { Button } from "./ui/button";
import { Input } from "./ui/field";
import { Notice } from "./notice";

function useAction() {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(key: string, path: string, payload: unknown) {
    setPending(key);
    setError(null);
    try {
      await apiPost(path, payload);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "操作失败");
    } finally {
      setPending(null);
    }
  }

  return { pending, error, run };
}

export function ReportActions({ report }: { report: ReportItem }) {
  const { pending, error, run } = useAction();
  if (report.status !== "open") return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {error && <Notice tone="warn">{error}</Notice>}
      <Button
        variant="primary"
        disabled={pending !== null}
        onClick={() =>
          void run("resolve", `/api/v1/staff/reports/${String(report.id)}/resolve`, {
            action: "resolve",
          })
        }
      >
        举报成立
      </Button>
      <Button
        variant="ghost"
        disabled={pending !== null}
        onClick={() =>
          void run("dismiss", `/api/v1/staff/reports/${String(report.id)}/resolve`, {
            action: "dismiss",
          })
        }
      >
        驳回
      </Button>
    </div>
  );
}

export function UserActions({ user }: { user: StaffUserItem }) {
  const { pending, error, run } = useAction();

  return (
    <div className="grid gap-2">
      {error && <Notice tone="warn">{error}</Notice>}
      <div className="flex flex-wrap gap-1.5">
        <Button
          variant="default"
          disabled={pending !== null}
          onClick={() =>
            void run("warn", `/api/v1/staff/users/${String(user.id)}/warn`, { reason: "Staff 警告" })
          }
        >
          警告
        </Button>
        {user.status !== "active" ? (
          <Button
            variant="primary"
            disabled={pending !== null}
            onClick={() => void run("restore", `/api/v1/staff/users/${String(user.id)}/restore`, {})}
          >
            恢复
          </Button>
        ) : (
          <>
            <Button
              variant="default"
              disabled={pending !== null}
              onClick={() =>
                void run("suspend", `/api/v1/staff/users/${String(user.id)}/suspend`, {})
              }
            >
              停用
            </Button>
            <Button
              variant="primary"
              disabled={pending !== null}
              onClick={() => void run("ban", `/api/v1/staff/users/${String(user.id)}/ban`, {})}
            >
              封禁
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export function AnomalyActions({ anomaly }: { anomaly: AnomalyItem }) {
  const { pending, error, run } = useAction();
  if (anomaly.status !== "open") return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {error && <Notice tone="warn">{error}</Notice>}
      <Button
        variant="default"
        disabled={pending !== null}
        onClick={() =>
          void run("resolve", `/api/v1/staff/anomalies/${String(anomaly.id)}/resolve`, {
            action: "resolve",
          })
        }
      >
        标记处理
      </Button>
      <Button
        variant="primary"
        disabled={pending !== null}
        onClick={() =>
          void run("freeze", `/api/v1/staff/anomalies/${String(anomaly.id)}/resolve`, {
            action: "freeze",
            days: 7,
          })
        }
      >
        冻结收益 7 天
      </Button>
      <Button
        variant="primary"
        disabled={pending !== null}
        onClick={() =>
          void run("ban", `/api/v1/staff/anomalies/${String(anomaly.id)}/resolve`, { action: "ban" })
        }
      >
        封禁用户
      </Button>
    </div>
  );
}

export function AppealActions({ appeal }: { appeal: AppealItem }) {
  const { pending, error, run } = useAction();
  const [note, setNote] = useState("");
  if (appeal.status !== "open") return null;

  return (
    <div className="grid gap-2">
      {error && <Notice tone="warn">{error}</Notice>}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label={`处理说明 ${String(appeal.id)}`}
          placeholder="处理说明（可选）"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="h-9 w-56"
        />
        <Button
          variant="primary"
          disabled={pending !== null}
          onClick={() =>
            void run("accept", `/api/v1/staff/appeals/${String(appeal.id)}/resolve`, {
              action: "accept",
              note: note.trim() || undefined,
            })
          }
        >
          通过
        </Button>
        <Button
          variant="ghost"
          disabled={pending !== null}
          onClick={() =>
            void run("reject", `/api/v1/staff/appeals/${String(appeal.id)}/resolve`, {
              action: "reject",
              note: note.trim() || undefined,
            })
          }
        >
          驳回
        </Button>
      </div>
    </div>
  );
}
