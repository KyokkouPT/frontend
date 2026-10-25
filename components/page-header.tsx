import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="面包屑" className="flex items-center gap-1.5 text-xs text-fg-2">
      {items.map((crumb, index) => (
        <span key={`${crumb.label}-${String(index)}`} className="flex items-center gap-1.5">
          {index > 0 && <ChevronRight className="size-3 opacity-50" />}
          {crumb.href ? (
            <Link href={crumb.href} className="hover:text-fg-0">
              {crumb.label}
            </Link>
          ) : (
            <span className="truncate">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function PageHeader({
  title,
  count,
  description,
  actions,
  children,
}: {
  title: ReactNode;
  count?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mt-3 mb-6 border-b border-line">
      <div className="flex flex-wrap items-end gap-4 pb-4">
        <div className="min-w-0">
          <h1 className="flex items-baseline gap-3 text-2xl font-semibold tracking-[-0.02em]">
            {title}
            {count && (
              <span className="font-mono text-sm font-medium tracking-normal text-fg-2">{count}</span>
            )}
          </h1>
          {description && <p className="mt-0.5 text-sm text-fg-1">{description}</p>}
        </div>
        {actions && <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
