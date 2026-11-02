"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  BonusFormulaPreviewResponse,
  BonusFormulaTorrentTerm,
  StaffSettingsResponse,
} from "@kyokkou/contracts";
import { ApiClientError, apiFetch } from "@/lib/api/client";
import { Button } from "./ui/button";
import { Field, Input, Textarea } from "./ui/field";
import { Notice } from "./notice";
import { Panel } from "./ui/panel";

const HELPERS = [
  "seeders",
  "total_gb",
  "age_days",
  "bonus",
  "is_donor",
  "t.age_weeks",
  "t.size_gb",
  "t.seeders",
  "t.weight",
  "min(a, b)",
  "max(a, b)",
  "sqrt(x)",
  "atan(x)",
  "round(x, 2)",
  "trunc(x, -1)",
  "sum(...)",
  "if(cond, a, b)",
];

function errorText(error: unknown, fallback: string): string {
  return error instanceof ApiClientError ? (error.fields?.[0]?.message ?? error.message) : fallback;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(4);
}

export function BonusFormulaPanel({
  initial,
  kind = "bonus",
}: {
  initial: {
    cron?: string;
    formula: string;
    next_run_at?: number | null;
    default_formula?: string;
  };
  kind?: "bonus" | "seed_points";
}) {
  const isSeedPoints = kind === "seed_points";
  const router = useRouter();
  const [cron, setCron] = useState(initial.cron ?? "0 * * * *");
  const [formula, setFormula] = useState(initial.formula);
  const [nextRun, setNextRun] = useState<number | null>(initial.next_run_at ?? null);
  const [preview, setPreview] = useState<BonusFormulaPreviewResponse | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function insert(token: string): void {
    const element = textareaRef.current;
    if (!element) {
      setFormula((previous) => `${previous}\n${token}`);
      return;
    }
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const insertText = token.includes("…") ? token.replace("…", "expr") : token;
    const next = formula.slice(0, start) + insertText + formula.slice(end);
    setFormula(next);
    requestAnimationFrame(() => {
      element.focus();
      const cursor = start + insertText.length;
      element.setSelectionRange(cursor, cursor);
    });
  }

  async function validate(): Promise<void> {
    setPending("preview");
    setError(null);
    setMessage(null);
    try {
      const result = await apiFetch<BonusFormulaPreviewResponse>("/api/v1/staff/bonus/formula/preview", {
        method: "POST",
        body: JSON.stringify({ formula }),
      });
      setPreview(result);
      setMessage(result.warnings.length > 0 ? result.warnings.join("；") : "公式校验通过");
    } catch (caught) {
      setPreview(null);
      setError(errorText(caught, "公式校验失败"));
    } finally {
      setPending(null);
    }
  }

  async function save(): Promise<void> {
    setPending("save");
    setError(null);
    setMessage(null);
    try {
      const response = await apiFetch<StaffSettingsResponse>("/api/v1/staff/settings", {
        method: "PUT",
        body: JSON.stringify(
          isSeedPoints ? { seed_points: { formula } } : { bonus: { cron: cron.trim(), formula } },
        ),
      });
      if (!isSeedPoints) setNextRun(response.settings.bonus.next_run_at ?? null);
      setMessage(isSeedPoints ? "做种积分公式已保存" : "魔力值调度与公式已保存");
      router.refresh();
    } catch (caught) {
      setError(errorText(caught, "保存失败"));
    } finally {
      setPending(null);
    }
  }

  return (
    <Panel
      title={isSeedPoints ? "做种积分公式" : "魔力值调度与公式"}
      description={
        isSeedPoints
          ? "独立于魔力值余额；默认使用 NexusPHP 风格公式，不叠加捐赠/勋章倍率。随魔力值 cron 结算。"
          : "独立 cron；按标称间隔结算。公式由管理员自定义，保存前会校验。"
      }
    >
      {error && <Notice tone="warn">{error}</Notice>}
      {message && <Notice tone="info">{message}</Notice>}

      <div className="mt-3 grid gap-3">
        {!isSeedPoints && (
          <Field label="魔力值 cron" htmlFor="bonus-cron" hint="默认 0 * * * *；最小间隔 5 分钟">
            <Input id="bonus-cron" value={cron} onChange={(event) => setCron(event.target.value)} />
          </Field>
        )}

        <Field
          label={isSeedPoints ? "做种积分公式（每小时产出）" : "公式（每小时产出）"}
          htmlFor={isSeedPoints ? "seed-points-formula" : "bonus-formula"}
        >
          <Textarea
            id={isSeedPoints ? "seed-points-formula" : "bonus-formula"}
            ref={textareaRef}
            value={formula}
            onChange={(event) => setFormula(event.target.value)}
            rows={14}
            className="font-mono text-xs"
            spellCheck={false}
          />
        </Field>

        <div className="flex flex-wrap gap-1.5">
          {HELPERS.map((token) => (
            <button
              key={token}
              type="button"
              onClick={() => insert(token)}
              className="rounded-sm border border-line bg-surface-2 px-2 py-1 font-mono text-2xs text-fg-1 transition-colors hover:border-line-strong hover:text-fg-0"
            >
              {token}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="default"
            disabled={pending !== null}
            onClick={() => void validate()}
          >
            {pending === "preview" ? "校验中…" : "校验并预览"}
          </Button>
          <Button type="button" variant="primary" disabled={pending !== null} onClick={() => void save()}>
            {pending === "save" ? "保存中…" : isSeedPoints ? "保存做种积分公式" : "保存调度与公式"}
          </Button>
          <Button
            type="button"
            variant="default"
            disabled={pending !== null || !initial.default_formula}
            onClick={() => setFormula(initial.default_formula ?? formula)}
          >
            载入默认公式
          </Button>
          {!isSeedPoints && (
            <span className="text-xs text-fg-2">
              下次运行：{nextRun ? new Date(nextRun).toLocaleString("zh-CN") : "—"}
            </span>
          )}
        </div>

        {preview && (
          <div className="grid gap-3 rounded-md border border-line bg-surface-1 p-3">
            <div className="text-sm">
              计算结果：<span className="font-mono font-semibold text-accent">{formatNumber(preview.result)}</span>{" "}
              {isSeedPoints ? "积分/小时" : "魔力值/小时"}
            </div>
            {Object.keys(preview.variables).length > 0 && (
              <div className="flex flex-wrap gap-2 text-xs text-fg-1">
                {Object.entries(preview.variables).map(([name, value]) => (
                  <span key={name} className="rounded-sm bg-surface-2 px-2 py-1 font-mono">
                    {name} = {formatNumber(value)}
                  </span>
                ))}
              </div>
            )}
            {preview.torrents.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-line text-fg-2">
                      <th className="py-2 pr-3 font-medium">种子</th>
                      <th className="py-2 pr-3 font-medium">GB</th>
                      <th className="py-2 pr-3 font-medium">周数</th>
                      <th className="py-2 pr-3 font-medium">做种数</th>
                      <th className="py-2 pr-3 font-medium">权重</th>
                      <th className="py-2 font-medium">Σ 项</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.torrents.map((torrent: BonusFormulaTorrentTerm) => (
                      <tr key={torrent.id} className="border-b border-line/60 last:border-0">
                        <td className="py-1.5 pr-3 font-mono">#{torrent.id}</td>
                        <td className="py-1.5 pr-3 font-mono">{torrent.size_gb.toFixed(2)}</td>
                        <td className="py-1.5 pr-3 font-mono">{torrent.age_weeks.toFixed(1)}</td>
                        <td className="py-1.5 pr-3 font-mono">{torrent.seeders}</td>
                        <td className="py-1.5 pr-3 font-mono">{torrent.weight}</td>
                        <td className="py-1.5 font-mono">{torrent.term.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}
