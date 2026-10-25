import { cn } from "@/lib/cn";

/** 用户头像：色相由用户名哈希得出，正式实现换成 identicon */
export function Avatar({
  name,
  hue,
  initial,
  size = "md",
  className,
}: {
  name: string;
  hue: number;
  /** 头像上的字符；默认取用户名首字（英文名建议显式传入中文简称） */
  initial?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dim = size === "sm" ? "size-6 text-[11px]" : size === "lg" ? "size-11 text-base" : "size-8 text-sm";
  return (
    <span
      aria-hidden
      className={cn(
        "inline-grid shrink-0 select-none place-items-center rounded-pill font-semibold text-white",
        "shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)]",
        dim,
        className,
      )}
      style={{
        backgroundImage: `linear-gradient(140deg, hsl(${hue} 62% 42%), hsl(${hue + 44} 58% 34%))`,
      }}
    >
      {initial ?? name.slice(0, 1)}
    </span>
  );
}
