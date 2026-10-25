import { redirect } from "next/navigation";
import type { BonusResponse } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { PageHeader } from "@/components/page-header";
import { Notice } from "@/components/notice";
import { ExchangeList } from "@/components/bonus-exchange";
import { Panel } from "@/components/ui/panel";
import { StatCard } from "@/components/ui/stat";
import { formatDate, formatNumber, formatRelativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "魔力值" };

export default async function BonusPage() {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect("/login?next=/me/bonus");

  let bonus: BonusResponse;
  try {
    bonus = await serverFetch<BonusResponse>("/api/v1/me/bonus");
  } catch (error) {
    const message =
      error instanceof ServerFetchError
        ? `后端返回 ${String(error.status)}：${error.message}`
        : error instanceof Error
          ? error.message
          : "无法连接后端";
    return (
      <Panel title="魔力值加载失败">
        <Notice tone="warn">{message}</Notice>
      </Panel>
    );
  }

  const frozen = bonus.frozen_until !== null && bonus.frozen_until > Date.now();

  return (
    <>
      <PageHeader
        title="魔力值"
        count={formatNumber(bonus.balance)}
        description="做种产出按时间结算，每次余额变化都会写入账本。"
      />

      {frozen && (
        <Notice tone="warn" className="mb-4">
          收益冻结至 {formatDate(bonus.frozen_until ?? Date.now())}：冻结期间产出为 0，兑换会返回 403。
        </Notice>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="当前余额" value={formatNumber(bonus.balance)} tone="accent" />
        <StatCard
          label="每小时产出"
          value={bonus.yield_per_hour.toFixed(2)}
          sub="按做种数与体积计算"
          tone={frozen ? "warn" : "default"}
        />
        <StatCard label="兑换项" value={formatNumber(bonus.items.length)} sub="可用魔力值兑换" />
        <StatCard label="账本记录" value={formatNumber(bonus.ledger.length)} sub="最近 20 条" />
      </div>

      <div className="grid gap-6">
        <Panel title="兑换" description="扣余额、写账本；同一 Idempotency-Key 不会重复扣款">
          <ExchangeList items={bonus.items} frozen={frozen} balance={bonus.balance} />
        </Panel>

        <Panel title="魔力账本" description="每次余额变化都有记录" flush>
          {bonus.ledger.length === 0 ? (
            <p className="p-4 text-sm text-fg-2">还没有账本记录。</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs text-fg-2">
                    <th className="px-4 py-2.5 font-medium">时间</th>
                    <th className="px-3 py-2.5 font-medium">类型</th>
                    <th className="px-3 py-2.5 text-right font-medium">变动</th>
                    <th className="px-3 py-2.5 text-right font-medium">余额</th>
                    <th className="px-4 py-2.5 font-medium">说明</th>
                  </tr>
                </thead>
                <tbody>
                  {bonus.ledger.map((entry) => (
                    <tr key={entry.id} className="border-b border-line/60 last:border-0">
                      <td className="px-4 py-2.5 text-xs text-fg-2">
                        {formatRelativeTime(entry.created_at)}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs">{entry.kind}</td>
                      <td
                        className={`px-3 py-2.5 text-right font-mono text-xs ${
                          entry.delta < 0 ? "text-danger" : "text-ok"
                        }`}
                      >
                        {entry.delta > 0 ? "+" : ""}
                        {formatNumber(entry.delta)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs">
                        {formatNumber(entry.balance_after)}
                      </td>
                      <td className="max-w-[320px] truncate px-4 py-2.5 text-xs text-fg-2">
                        {entry.note ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
