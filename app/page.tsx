import { healthResponse } from "@kyokkou/contracts";
import { BrandMark } from "@/components/brand-mark";
import { ThemeSwitch } from "@/components/theme-switch";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { ServerFetchError, serverFetch } from "@/lib/api/server";

/**
 * Phase 0 的连通性页面：真实调用后端 /api/v1/health，不使用任何假数据。
 * Phase 1 会用 bootstrap + /home 驱动的首页替换它。
 */
export const dynamic = "force-dynamic";

type HealthState =
  | { ok: true; version: string }
  | { ok: false; message: string };

async function loadHealth(): Promise<HealthState> {
  try {
    const payload = await serverFetch<unknown>("/api/v1/health");
    const parsed = healthResponse.safeParse(payload);
    if (!parsed.success) {
      return { ok: false, message: "后端响应不符合 health 契约" };
    }
    return { ok: true, version: parsed.data.version };
  } catch (error) {
    if (error instanceof ServerFetchError) {
      return { ok: false, message: `HTTP ${error.status} · ${error.message}` };
    }
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

export default async function HomePage() {
  const health = await loadHealth();

  return (
    <main id="main" className="grid min-h-dvh place-items-center p-4">
      <div className="w-full max-w-xl">
        <header className="mb-6 flex items-center gap-3">
          <BrandMark size={32} />
          <div className="min-w-0">
            <p className="text-2xs font-semibold tracking-[0.08em] text-fg-2 uppercase">
              Phase 0 · 应用骨架
            </p>
            <h1 className="text-xl font-semibold tracking-[-0.02em]">KyokkouPT</h1>
          </div>
          <ThemeSwitch className="ml-auto" />
        </header>

        <Panel
          title="后端连接"
          description="此页为 Phase 0 的连通性检查，Phase 1 会替换为 bootstrap 驱动的首页。"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={health.ok ? "ok" : "danger"}>{health.ok ? "已连接" : "无法连接"}</Badge>
            <span className="text-sm text-fg-1">
              {health.ok ? `后端版本 ${health.version}` : health.message}
            </span>
          </div>

          {!health.ok && (
            <p className="mt-3 text-xs leading-relaxed text-fg-2">
              确认后端已启动：在 <code className="font-mono">backend/</code> 执行{" "}
              <code className="font-mono">pnpm dev</code>（http://127.0.0.1:31001）。
            </p>
          )}
        </Panel>

        <p className="mt-4 text-xs leading-relaxed text-fg-2">
          设计系统移植自 <code className="font-mono">web/</code> v0 原型；数据层尚未接入，
          浏览、上传、Tracker、站务等页面将在后续纵切中逐个接到真实 API。
        </p>
      </div>
    </main>
  );
}
