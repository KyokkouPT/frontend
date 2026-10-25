import type { TorrentSummary } from "@kyokkou/contracts";
import { ArrowDown, ArrowUp, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatBytes, formatRelativeTime } from "@/lib/format";
import { Avatar } from "./ui/avatar";
import { PromoBadge } from "./promo-badge";

/**
 * 种子列表行。Phase 1 只有展示（详情/下载在目录纵切接入），
 * 因此不渲染无效的链接与下载按钮。
 */
export function TorrentRow({ torrent }: { torrent: TorrentSummary }) {
  const specs = [torrent.section.name, torrent.category.name, ...Object.values(torrent.meta).map(String)]
    .filter((value) => value.length > 0)
    .slice(0, 4);

  return (
    <article
      className={cn(
        "grid items-center gap-4 rounded-md border border-line bg-surface-1 py-2.5 pr-3 pl-4",
        "transition-colors hover:border-line-strong hover:bg-surface-2",
        "grid-cols-[44px_1fr] md:grid-cols-[44px_1fr_auto_auto]",
        torrent.owned && "border-l-2 border-l-accent",
      )}
    >
      <PromoBadge promo={torrent.promo} />

      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[13.5px] leading-5 font-semibold tracking-[-0.005em]">
            {torrent.name}
          </span>
          {torrent.tags.slice(0, 2).map((tag, index) => (
            <span
              key={tag}
              className={cn(
                "hidden shrink-0 items-center rounded-pill border px-1.5 py-px text-2xs sm:inline-flex",
                index === 0
                  ? "border-transparent bg-accent/12 text-accent"
                  : "border-line bg-surface-2 text-fg-1",
              )}
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-0.5 line-clamp-1 text-xs leading-4 text-fg-1">{specs.join(" · ")}</div>

        <div className="flex flex-wrap items-center gap-2 text-[11.5px] leading-[15px] text-fg-2">
          {torrent.uploader ? (
            <span className="flex items-center gap-1.5 text-fg-1">
              <Avatar
                name={torrent.uploader.name}
                hue={torrent.uploader.hue}
                size="sm"
                initial={torrent.uploader.name.slice(0, 1)}
              />
              {torrent.uploader.name}
            </span>
          ) : (
            <span>未知发布者</span>
          )}
          <i className="not-italic opacity-55">·</i>
          <span>{formatRelativeTime(torrent.created_at)}</span>
          <i className="not-italic opacity-55">·</i>
          <span className="font-mono">#{torrent.id}</span>
          {torrent.owned && (
            <>
              <i className="not-italic opacity-55">·</i>
              <span className="text-accent">我的发布</span>
            </>
          )}
        </div>
      </div>

      <div className="hidden items-center gap-3 md:flex">
        <Metric icon={<ArrowUp className="size-3 text-ok" />} value={torrent.seeders} />
        <Metric icon={<ArrowDown className="size-3 text-accent-2" />} value={torrent.leechers} />
        <Metric icon={<Check className="size-3 text-fg-2" />} value={torrent.completed} />
      </div>

      <div className="hidden text-right font-mono text-sm leading-none font-medium text-fg-0 sm:block">
        <span className="whitespace-nowrap">{formatBytes(torrent.size)}</span>
        <small className="mt-0.5 block font-mono text-[10.5px] leading-4 font-normal text-fg-2">
          {torrent.files_count} 个文件
        </small>
      </div>
    </article>
  );
}

function Metric({ icon, value }: { icon: React.ReactNode; value: number }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono text-xs font-medium",
        value === 0 ? "text-fg-2" : "text-fg-1",
      )}
    >
      {icon}
      {value}
    </span>
  );
}
