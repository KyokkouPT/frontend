import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "default" | "ghost";
type Size = "md" | "lg" | "icon";

const BASE =
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-sm border " +
  "font-medium transition-colors active:translate-y-px " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const VARIANT: Record<Variant, string> = {
  primary: "border-accent bg-accent font-semibold text-accent-ink hover:brightness-110",
  default: "border-line bg-surface-1 text-fg-0 hover:border-line-strong hover:bg-surface-2",
  ghost: "border-transparent bg-transparent text-fg-1 hover:bg-surface-2 hover:text-fg-0",
};

const SIZE: Record<Size, string> = {
  // 移动端 40px 起，桌面 34px —— 触控目标不小于 40
  md: "h-10 px-3 text-base md:h-[34px]",
  lg: "h-10 px-4 text-base",
  icon: "size-10 p-0 md:size-[34px]",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = "default",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(BASE, VARIANT[variant], SIZE[size], className)}
      {...props}
    />
  );
}
