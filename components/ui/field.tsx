import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const CONTROL =
  "w-full rounded-sm border border-line bg-surface-0 text-fg-0 placeholder:text-fg-2 " +
  "transition-colors hover:border-line-strong focus:border-accent focus:outline-none " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
  "disabled:cursor-not-allowed disabled:opacity-50";

export function Field({
  label,
  hint,
  htmlFor,
  required,
  children,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid content-start gap-1.5", className)}>
      <label htmlFor={htmlFor} className="flex items-center gap-1 text-xs leading-4 font-medium text-fg-1">
        {label}
        {required && <span className="text-danger">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11.5px] leading-4 text-fg-2">{hint}</p>}
    </div>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL, "h-10 px-3 text-sm md:h-[34px]", className)} {...props} />;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(CONTROL, "min-h-[88px] resize-y px-3 py-2 text-sm leading-relaxed", className)}
        {...props}
      />
    );
  },
);

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select className={cn(CONTROL, "h-10 cursor-pointer px-3 text-sm md:h-[34px]", className)} {...props}>
      {children}
    </select>
  );
}

/** 只读的键值信息块，用于详情/确认页 */
export function DescriptionList({
  items,
  columns = 1,
  className,
}: {
  items: [ReactNode, ReactNode][];
  columns?: 1 | 2;
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "grid gap-x-6 gap-y-2.5",
        columns === 2 ? "sm:grid-cols-2" : "grid-cols-1",
        className,
      )}
    >
      {items.map(([k, v], i) => (
        <div key={i} className="flex items-baseline gap-3 border-b border-line/60 pb-2 last:border-0">
          <dt className="w-24 shrink-0 text-xs text-fg-2">{k}</dt>
          <dd className="min-w-0 text-sm">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
