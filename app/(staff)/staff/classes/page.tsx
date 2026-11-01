import Link from "next/link";
import { redirect } from "next/navigation";
import type { ClassesResponse } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { ClassDeleteButton } from "@/components/class-actions";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";

export const dynamic = "force-dynamic";

export const metadata = { title: "等级管理" };

export default async function StaffClassesPage() {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect("/login?next=/staff/classes");
  if (!bootstrap.permissions.includes("staff.classes")) {
    return (
      <Panel title="无权访问">
        <Notice tone="warn">当前账号没有等级管理权限。</Notice>
      </Panel>
    );
  }

  let data: ClassesResponse;
  try {
    data = await serverFetch<ClassesResponse>("/api/v1/staff/classes");
  } catch (error) {
    const message =
      error instanceof ServerFetchError
        ? `后端返回 ${String(error.status)}：${error.message}`
        : error instanceof Error
          ? error.message
          : "无法连接后端";
    return (
      <Panel title="等级加载失败">
        <Notice tone="warn">{message}</Notice>
      </Panel>
    );
  }

  return (
    <>
      <PageHeader
        title="等级管理"
        description="等级决定权限与自动升降；rank 越大越高。只能管理 rank 低于自己的等级。"
        actions={
          <Link
            href="/staff/classes/new"
            className="inline-flex h-10 items-center rounded-sm border border-accent bg-accent px-4 text-sm font-semibold text-accent-ink transition hover:brightness-110"
          >
            新建等级
          </Link>
        }
      />

      <Panel flush>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-fg-2">
                <th className="px-4 py-2.5 font-medium">等级</th>
                <th className="px-3 py-2.5 font-medium">rank</th>
                <th className="px-3 py-2.5 font-medium">自动升降</th>
                <th className="px-3 py-2.5 font-medium">权限数</th>
                <th className="px-3 py-2.5 font-medium">用户数</th>
                <th className="px-4 py-2.5 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => {
                const autoPromote = item.permissions.includes("class.auto_promote");
                const autoDemote = item.permissions.includes("class.auto_demote");
                return (
                  <tr key={item.slug} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        <b className="text-sm font-semibold">{item.name}</b>
                        {item.badge && <Badge tone="accent">{item.badge}</Badge>}
                      </span>
                      <span className="block font-mono text-2xs text-fg-2">{item.slug}</span>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs">{item.rank}</td>
                    <td className="px-3 py-3 text-xs">
                      <span className="flex flex-wrap gap-1">
                        <Badge tone={autoPromote ? "ok" : "muted"}>升 {autoPromote ? "自动" : "手动"}</Badge>
                        <Badge tone={autoDemote ? "ok" : "muted"}>降 {autoDemote ? "自动" : "手动"}</Badge>
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs">{item.permissions.length}</td>
                    <td className="px-3 py-3 font-mono text-xs">{item.member_count ?? 0}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-3 text-xs">
                        <Link
                          href={`/staff/classes/${item.slug}`}
                          className="text-fg-1 underline decoration-line underline-offset-2 hover:text-accent"
                        >
                          编辑
                        </Link>
                        <ClassDeleteButton slug={item.slug} name={item.name} />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <p className="mt-4 text-xs text-fg-2">
        分享率矩阵与站内信模板在 <Link href="/staff/classes/rules" className="text-accent">等级规则</Link>；重算调度在{" "}
        <Link href="/staff/settings" className="text-accent">站点设置</Link>。
      </p>
    </>
  );
}
