import type { RulesResponse } from "@kyokkou/contracts";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { PageHeader } from "@/components/page-header";
import { Notice } from "@/components/notice";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/markdown";
import { Panel } from "@/components/ui/panel";
import { formatDuration, formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "规则" };

export default async function RulesPage() {
  let rules: RulesResponse;
  try {
    rules = await serverFetch<RulesResponse>("/api/v1/rules");
  } catch (error) {
    const message =
      error instanceof ServerFetchError
        ? `后端返回 ${String(error.status)}：${error.message}`
        : error instanceof Error
          ? error.message
          : "无法连接后端";
    return (
      <Panel title="规则加载失败" description="请确认后端已启动">
        <Notice tone="warn">{message}</Notice>
      </Panel>
    );
  }

  return (
    <>
      <PageHeader
        title="规则"
        description="注册、审核、Tracker、H&R 与分区规范均由站点配置驱动，修改后无需重启。"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {rules.content.trim() && (
          <Panel
            title="站点规则 / FAQ / 版规"
            description="由站点管理员维护"
            className="lg:col-span-2"
          >
            <Markdown>{rules.content}</Markdown>
          </Panel>
        )}

        <Panel title="注册">
          <dl className="grid gap-2.5 text-sm">
            <Row label="开放注册" value={rules.registration.open ? "是" : "否"} />
            <Row label="邀请注册" value={rules.registration.invite_registration_enabled ? "启用" : "关闭"} />
            <div className="grid gap-1 border-b border-line/60 pb-2.5 last:border-0">
              <dt className="text-xs text-fg-2">关闭注册说明</dt>
              <dd className="text-[13px] leading-relaxed">{rules.registration.closed_message}</dd>
            </div>
          </dl>
        </Panel>

        <Panel title="审核与发布">
          <dl className="grid gap-2.5 text-sm">
            <Row label="可信发布者自动通过" value={rules.review.auto_approve_trusted ? "是" : "否"} />
            <Row label="可信门限（已通过数）" value={formatNumber(rules.review.trusted_min_approved)} />
            <Row label="待审提醒阈值" value={`${formatNumber(rules.review.pending_alert_hours)} 小时`} />
          </dl>
        </Panel>

        <Panel title="Tracker">
          <dl className="grid gap-2.5 text-sm">
            <Row label="announce 间隔" value={`${formatNumber(rules.tracker.announce_interval)} 秒`} />
            <Row label="最小间隔" value={`${formatNumber(rules.tracker.min_interval)} 秒`} />
          </dl>
        </Panel>

        <Panel title="H&R（Hit and Run）">
          <dl className="grid gap-2.5 text-sm">
            <Row label="启用" value={rules.hnr.enabled ? "是" : "否"} />
            <Row label="要求做种时长" value={formatDuration(rules.hnr.seed_seconds)} />
            <Row label="完成期限" value={`${formatNumber(rules.hnr.deadline_days)} 天`} />
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-fg-2">
            下载量达到策略阈值后会产生保种义务；到期未达标会被记为 H&R，可用魔力值清除。
          </p>
        </Panel>
      </div>

      <Panel
        title="分区规范"
        description="发布时必须填写的字段与命名规范"
        className="mt-6"
        flush
      >
        {rules.sections.length === 0 ? (
          <p className="p-4 text-sm text-fg-2">分区尚未配置。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs text-fg-2">
                  <th className="px-4 py-2.5 font-medium">分区</th>
                  <th className="px-4 py-2.5 font-medium">审核模式</th>
                  <th className="px-4 py-2.5 font-medium">命名规范</th>
                  <th className="px-4 py-2.5 font-medium">必填字段</th>
                </tr>
              </thead>
              <tbody>
                {rules.sections.map((section) => (
                  <tr key={section.slug} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-2.5 font-medium">{section.name}</td>
                    <td className="px-4 py-2.5">
                      <Badge tone="default">{section.review_mode}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-fg-1">
                      {section.charter?.naming ?? "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1.5">
                        {section.fields.length === 0 ? (
                          <span className="text-xs text-fg-2">—</span>
                        ) : (
                          section.fields.map((field) => (
                            <Badge key={field.key} tone={field.required ? "accent" : "default"}>
                              {field.label}
                              {field.options ? `: ${field.options.join("/")}` : ""}
                            </Badge>
                          ))
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-3 border-b border-line/60 pb-2.5 last:border-0">
      <dt className="text-xs text-fg-2">{label}</dt>
      <dd className="ml-auto font-mono text-[13px]">{value}</dd>
    </div>
  );
}
