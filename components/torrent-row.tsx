import Link from "next/link";
import type { ReactNode } from "react";
import type { TorrentSummary } from "@kyokkou/contracts";
import { ArrowDown, ArrowUp, Check, Download, LogIn } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatBytes, formatRelativeTime } from "@/lib/format";
import { Avatar } from "./ui/avatar";
import { PromoBadge } from "./promo-badge";
import { ZeroBonusBadge } from "./zero-bonus-badge";

/** 种子列表行：标题进详情，下载按钮按登录态指向下载或登录。 */
export function TorrentRow({ torrent, canDownload = false }: { torrent: TorrentSummary; canDownload?: boolean }) {
  const specs = [torrent.section.name, torrent.category.name, ...Object.values(torrent.meta).map(String)]
    .filter((value) => value.length > 0)
    .slice(0, 4);

  const actionHref = canDownload
    ? torrent.download_url
    : `/login?next=${encodeURIComponent(`/t/${String(torrent.id)}`)}`;

  return (
    <article
      className={cn(
        "grid items-center gap-4 rounded-md border border-line bg-surface-1 py-2.5 pr-3 pl-4",
        "transition-colors hover:border-line-strong hover:bg-surface-2",
        "grid-cols-[44px_1fr_44px] sm:grid-cols-[44px_1fr_auto_44px] md:grid-cols-[44px_1fr_auto_auto_44px]",
        torrent.owned && "border-l-2 border-l-accent",
      )}
    >
      <PromoBadge promo={torrent.promo} />

      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href={`/t/${String(torrent.id)}`}
            className="truncate text-[13.5px] leading-5 font-semibold tracking-[-0.005em] hover:text-accent"
          >
            {torrent.name}
          </Link>
          {torrent.zero_bonus && <ZeroBonusBadge />}
          {torrent.tags.slice(0, 2).map((tag, index) => (            <span
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

      <div className="grid place-items-center">
        <a
          href={actionHref}
          aria-label={canDownload ? `下载种子 ${torrent.name}` : "登录后下载"}
          className="grid size-11 place-items-center rounded-sm text-fg-2 transition-colors hover:bg-accent/12 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:size-[34px]"
        >
          {canDownload ? <Download className="size-4" /> : <LogIn className="size-4" />}
        </a>
      </div>
    </article>
  );
}

function Metric({ icon, value }: { icon: ReactNode; value: number }) {
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
