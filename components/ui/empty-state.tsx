import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  actions,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="grid place-items-center gap-3 rounded-md border border-dashed border-line-strong bg-surface-1 px-4 py-12 text-center">
      {icon && (
        <span className="grid size-11 place-items-center rounded-pill bg-surface-2 text-fg-2">
          {icon}
        </span>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="max-w-[380px] text-sm text-fg-1">{description}</p>}
      {actions && <div className="flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}
