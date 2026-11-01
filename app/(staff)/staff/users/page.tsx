import Link from "next/link";
import { redirect } from "next/navigation";
import type { StaffUsersResponse } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { formatRatio } from "@/lib/format";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { UserToolbox } from "@/components/user-toolbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Panel } from "@/components/ui/panel";

export const dynamic = "force-dynamic";

export const metadata = { title: "用户管理" };

const STATUS_LABEL: Record<string, string> = {
  active: "正常",
  suspended: "停用",
  banned: "封禁",
};

const ROLE_LABEL: Record<string, string> = {
  user: "用户",
  moderator: "版主",
  admin: "管理员",
};

export default async function StaffUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect("/login?next=/staff/users");
  if (!bootstrap.permissions.includes("staff.users")) {
    return (
      <Panel title="无权访问">
        <Notice tone="warn">当前账号没有用户管理权限。</Notice>
      </Panel>
    );
  }

  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  let data: StaffUsersResponse;
  try {
    data = await serverFetch<StaffUsersResponse>(
      `/api/v1/staff/users${query ? `?q=${encodeURIComponent(query)}` : ""}`,
    );
  } catch (error) {
    const message =
      error instanceof ServerFetchError
        ? `后端返回 ${String(error.status)}：${error.message}`
        : error instanceof Error
          ? error.message
          : "无法连接后端";
    return (
      <Panel title="用户列表加载失败">
        <Notice tone="warn">{message}</Notice>
      </Panel>
    );
  }

  return (
    <>
      <PageHeader
        title="用户管理"
        description="停用/封禁会立即撤销该用户的 session；删除仅允许无关联数据的账号。"
        actions={
          <Link
            href="/staff/users/new"
            className="inline-flex h-10 items-center rounded-sm border border-accent bg-accent px-4 text-sm font-semibold text-accent-ink transition hover:brightness-110"
          >
            新建用户
          </Link>
        }
      />

      <Panel flush>
        <form className="flex flex-wrap items-center gap-2 border-b border-line p-3" action="/staff/users" method="get">
          <Input name="q" defaultValue={query} placeholder="用户名或邮箱" className="h-9 max-w-xs" />
          <Button type="submit" variant="primary">
            搜索
          </Button>
          {query && (
            <Link href="/staff/users" className="text-xs text-fg-2 hover:text-accent">
              清除
            </Link>
          )}
        </form>

        {data.items.length === 0 ? (
          <p className="p-4 text-sm text-fg-2">没有匹配的用户。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs text-fg-2">
                  <th className="px-4 py-2.5 font-medium">用户名</th>
                  <th className="px-3 py-2.5 font-medium">权限组</th>
                  <th className="px-3 py-2.5 font-medium">状态</th>
                  <th className="px-3 py-2.5 font-medium">分享率</th>
                  <th className="px-4 py-2.5 font-medium">工具箱</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((user) => (
                  <tr key={user.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3">
                      <b className="block text-sm font-semibold">{user.username}</b>
                      <span className="block text-2xs text-fg-2">{user.email}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-sm">{ROLE_LABEL[user.role] ?? user.role}</span>
                      <span className="ml-1 font-mono text-2xs text-fg-2">{user.class_key}</span>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={user.status === "active" ? "ok" : user.status === "suspended" ? "warn" : "danger"}>
                        {STATUS_LABEL[user.status] ?? user.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs">{formatRatio(user.ratio)}</td>
                    <td className="px-4 py-3">
                      <UserToolbox user={user} />
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
