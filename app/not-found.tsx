import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="grid min-h-dvh place-items-center p-4">
      <div className="w-full max-w-md text-center">
        <p className="font-mono text-2xs tracking-[0.08em] text-fg-2 uppercase">404</p>
        <h1 className="mt-1 text-xl font-semibold tracking-[-0.02em]">页面不存在</h1>
        <p className="mt-1.5 text-sm text-fg-1">链接可能已失效，或者该资源已删除。</p>
        <Link
          href="/"
          className="mt-4 inline-flex h-10 items-center rounded-sm border border-line bg-surface-1 px-4 text-base font-medium text-fg-0 transition-colors hover:border-line-strong hover:bg-surface-2"
        >
          返回首页
        </Link>
      </div>
    </main>
  );
}
