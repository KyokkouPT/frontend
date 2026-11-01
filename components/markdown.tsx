import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/cn";

const components: Components = {
  h1: ({ children }) => <h2 className="mt-3 text-base font-semibold text-fg-0">{children}</h2>,
  h2: ({ children }) => <h3 className="mt-3 text-sm font-semibold text-fg-0">{children}</h3>,
  h3: ({ children }) => <h4 className="mt-2 text-sm font-medium text-fg-1">{children}</h4>,
  p: ({ children }) => <p className="my-1.5 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="my-1.5 list-disc space-y-0.5 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-1.5 list-decimal space-y-0.5 pl-5">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-fg-0">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  code: ({ children }) => (
    <code className="rounded-sm bg-surface-2 px-1 py-0.5 font-mono text-[0.9em] text-fg-0">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-sm bg-surface-2 p-2 text-xs">{children}</pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-accent/60 pl-3 text-fg-1">{children}</blockquote>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="font-medium text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noreferrer noopener" : undefined}
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-3 border-line" />,
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-left text-xs">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border-b border-line px-2 py-1 font-medium text-fg-1">{children}</th>,
  td: ({ children }) => <td className="border-b border-line/60 px-2 py-1">{children}</td>,
};

/** 用户可见的管理员 Markdown 文案；默认不渲染原始 HTML。 */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("break-words text-sm text-fg-1", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
