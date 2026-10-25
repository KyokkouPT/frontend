export default function Loading() {
  return (
    <main id="main" className="grid min-h-dvh place-items-center p-4">
      <div className="w-full max-w-xl" aria-busy="true" aria-live="polite">
        <div className="h-8 w-40 animate-pulse rounded-sm bg-surface-2" />
        <div className="mt-4 h-32 animate-pulse rounded-md border border-line bg-surface-1" />
        <p className="mt-3 text-xs text-fg-2">加载中…</p>
      </div>
    </main>
  );
}
