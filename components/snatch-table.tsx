import type { MeResponse } from "@kyokkou/contracts";
import { formatBytes, formatDuration, formatRatio, formatRelativeTime } from "@/lib/format";
import { Badge } from "./ui/badge";
import { EmptyState } from "./ui/empty-state";

type Snatch = MeResponse["snatches"][number];

export function SnatchTable({
  rows,
  emptyTitle,
  emptyDescription,
}: {
  rows: Snatch[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs text-fg-2">
            <th className="px-4 py-2.5 font-medium">种子</th>
            <th className="px-3 py-2.5 font-medium">状态</th>
            <th className="px-3 py-2.5 font-medium">上传</th>
            <th className="px-3 py-2.5 font-medium">下载</th>
            <th className="px-3 py-2.5 font-medium">分享率</th>
            <th className="px-3 py-2.5 font-medium">做种时长</th>
            <th className="px-4 py-2.5 font-medium">最近 announce</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const ratio = row.downloaded > 0 ? row.uploaded / row.downloaded : null;
            return (
              <tr key={row.torrent_id} className="border-b border-line/60 last:border-0">
                <td className="max-w-[420px] truncate px-4 py-2.5">{row.name}</td>
                <td className="px-3 py-2.5">
                  <Badge tone={row.status === "seeding" ? "ok" : "warn"}>
                    {row.status === "seeding" ? "做种中" : "下载中"}
                  </Badge>
                </td>
                <td className="px-3 py-2.5 font-mono text-xs">{formatBytes(row.uploaded)}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{formatBytes(row.downloaded)}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{formatRatio(ratio)}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{formatDuration(row.seedtime)}</td>
                <td className="px-4 py-2.5 text-xs text-fg-2">
                  {row.last_announce_at ? formatRelativeTime(row.last_announce_at) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
