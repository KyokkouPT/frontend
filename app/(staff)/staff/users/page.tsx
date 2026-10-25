import Link from "next/link";
import { redirect } from "next/navigation";
import type { StaffUsersResponse } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { UserActions } from "@/components/staff-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Panel } from "@/components/ui/panel";

export const dynamic = "force-dynamic";

export const metadata = { title: "用户管理" };

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
        description="停用/封禁会立即撤销该用户的 session，并通知本人；恢复后需重新登录。"
      />

      <Panel title="搜索" flush>
        <form className="flex flex-wrap items-center gap-2 p-3" action="/staff/users" method="get">
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
      </Panel>

      <div className="mt-4">
        <Panel flush>
          {data.items.length === 0 ? (
            <p className="p-4 text-sm text-fg-2">没有匹配的用户。</p>
          ) : (
            <ul className="divide-y divide-line">
              {data.items.map((user) => (
                <li key={user.id} className="grid gap-2 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <b className="text-sm">{user.username}</b>
                    <Badge tone={user.status === "active" ? "ok" : "warn"}>{user.status}</Badge>
                    <span className="text-2xs text-fg-2">{user.email}</span>
                    <span className="text-2xs text-fg-2">
                      上传 {user.uploaded} · 下载 {user.downloaded} · 魔力 {user.bonus}
                    </span>
                  </div>
                  <UserActions user={user} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
