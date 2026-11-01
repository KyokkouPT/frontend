import type { BtClientsResponse } from "@kyokkou/contracts";
import { formatDateTime, formatNumber } from "@/lib/format";
import { Badge } from "./ui/badge";
import { EmptyState } from "./ui/empty-state";
import { Panel } from "./ui/panel";

export function BtClientsPanel({ data }: { data: BtClientsResponse }) {
  if (data.hidden) {
    return (
      <Panel title="BT 客户端">
        <p className="text-sm text-fg-2">该用户未公开客户端信息。</p>
      </Panel>
    );
  }

  return (
    <Panel
      title="BT 客户端"
      description="按客户端 peer 会话聚合；识别码为 peer ID 前 8 位，启动时间为首次见到该客户端的时间"
    >
      {data.items.length === 0 ? (
        <EmptyState
          title="当前没有活跃客户端"
          description="客户端向 Tracker 汇报后，这里会显示连接信息。"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-fg-2">
                <th className="py-2 pr-3 font-medium">IPv4:端口</th>
                <th className="px-3 py-2 font-medium">[IPv6]:端口</th>
                <th className="px-3 py-2 font-medium">反向域名</th>
                <th className="px-3 py-2 font-medium">客户端识别码</th>
                <th className="px-3 py-2 font-medium">特征</th>
                <th className="px-3 py-2 font-medium">做种数量</th>
                <th className="px-3 py-2 font-medium">下载数量</th>
                <th className="px-3 py-2 font-medium">启动时间</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((client, index) => (
                <tr
                  key={`${client.client_code ?? "client"}-${String(index)}`}
                  className="border-b border-line/60 last:border-0"
                >
                  <td className="max-w-[220px] break-all py-2.5 pr-3 font-mono text-xs">
                    {client.ipv4 ?? "—"}
                  </td>
                  <td className="max-w-[220px] break-all px-3 py-2.5 font-mono text-xs">
                    {client.ipv6 ?? "—"}
                  </td>
                  <td className="max-w-[180px] break-all px-3 py-2.5 text-xs">
                    {client.reverse_dns ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs">{client.client_code ?? "—"}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {client.features === "4&6" ? (
                        <>
                          <Badge
                            tone="outline"
                            className="border-transparent bg-accent/15 text-accent"
                          >
                            4
                          </Badge>
                          <Badge
                            tone="outline"
                            className="border-transparent bg-accent-2/15 text-accent-2"
                          >
                            6
                          </Badge>
                        </>
                      ) : (
                        <Badge tone="muted">{client.features}</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs">{formatNumber(client.seeding)}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{formatNumber(client.leeching)}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">
                    {formatDateTime(client.started_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
