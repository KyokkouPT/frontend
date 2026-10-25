import { cn } from "@/lib/cn";

/**
 * 品牌标记：八向光线，对应 kyokkou「极光」。
 * 顶栏、登录页、页脚共用，尺寸由 size 控制。
 */
export function BrandMark({ size = 26, className }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("grid shrink-0 place-items-center", className)}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.34),
        backgroundImage:
          "linear-gradient(135deg, var(--color-accent) 0%, color-mix(in oklab, var(--color-accent) 55%, #4FA8FF) 45%, var(--color-accent-2) 100%)",
      }}
    >
      <svg
        viewBox="0 0 24 24"
        style={{ width: size * 0.62, height: size * 0.62 }}
        className="text-accent-ink"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3v6M12 15v6M4.5 7.5l4 4M15.5 12.5l4 4M4.5 16.5l4-4M15.5 11.5l4-4" />
      </svg>
    </span>
  );
}
