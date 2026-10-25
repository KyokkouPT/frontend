import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** 卡片容器：标题栏 + 内容。全站统一用它，别再手写 border/bg。 */
export function Panel({
  title,
  description,
  right,
  children,
  className,
  bodyClassName,
  flush,
}: {
  title?: ReactNode;
  description?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** true 时内容区不加内边距（表格/列表类用） */
  flush?: boolean;
}) {
  return (
    <section
      className={cn("min-w-0 overflow-hidden rounded-md border border-line bg-surface-1", className)}
    >
      {(title || right) && (
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-fg-2">{description}</p>}
          </div>
          {right && <div className="ml-auto flex shrink-0 items-center gap-1.5">{right}</div>}
        </div>
      )}
      <div className={cn("min-w-0", !flush && "p-4", bodyClassName)}>{children}</div>
    </section>
  );
}
