import type { AssessmentProgressItem } from "@kyokkou/contracts";
import { formatBytes } from "@/lib/format";

const GB = 1024 ** 3;

export function formatAssessmentValue(item: AssessmentProgressItem, value: number): string {
  if (item.unit === "GB") return formatBytes(value * GB);
  if (item.metric === "seedtime_delta") return `${value.toFixed(2)} 小时`;
  if (item.metric === "ratio") return value >= 9999 ? "∞" : value.toFixed(2);
  if (
    item.metric === "warnings" ||
    item.metric === "hnr_unfinished" ||
    item.metric === "published_delta"
  ) {
    return String(Math.round(value));
  }
  return `${value.toFixed(2)} 天`;
}

export function AssessmentProgressList({ items }: { items: AssessmentProgressItem[] }) {
  if (items.length === 0) return <p className="text-sm text-fg-2">暂无可计算进度。</p>;
  return (
    <div className="grid gap-3">
      {items.map((item) => {
        const percent =
          item.target <= 0
            ? 100
            : Math.max(0, Math.min(100, Math.round((item.current / item.target) * 100)));
        return (
          <div key={item.metric}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
              <span className="font-medium text-fg-1">{item.label}</span>
              <span className="font-mono text-fg-2">
                {formatAssessmentValue(item, item.current)} / {formatAssessmentValue(item, item.target)}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-pill bg-surface-2">
              <div
                className={percent >= 100 ? "h-full bg-ok" : "h-full bg-accent"}
                style={{ width: `${String(percent)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
