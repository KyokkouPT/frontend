import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { ClassesResponse, StaffUsersResponse, UserWarningsResponse } from "@kyokkou/contracts";
import { UserWarnings } from "@/components/user-warnings";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { UserForm } from "@/components/user-form";
import { Panel } from "@/components/ui/panel";

export const dynamic = "force-dynamic";

export const metadata = { title: "编辑用户" };

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
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

  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isSafeInteger(numericId) || numericId < 1) notFound();

  let data: StaffUsersResponse;
  let warnings: UserWarningsResponse;
  let classes: ClassesResponse["items"] = [];
  try {
    [data, { items: classes }, warnings] = await Promise.all([
      serverFetch<StaffUsersResponse>("/api/v1/staff/users"),
      serverFetch<ClassesResponse>("/api/v1/staff/users/classes"),
      serverFetch<UserWarningsResponse>(`/api/v1/staff/users/${String(numericId)}/warnings`),
    ]);
  } catch (error) {
    if (error instanceof ServerFetchError && error.status === 404) notFound();
    const message =
      error instanceof ServerFetchError
        ? `后端返回 ${String(error.status)}：${error.message}`
        : error instanceof Error
          ? error.message
          : "无法连接后端";
    return (
      <Panel title="用户加载失败">
        <Notice tone="warn">{message}</Notice>
      </Panel>
    );
  }

  const user = data.items.find((item) => item.id === numericId);
  if (!user) notFound();

  return (
    <>
      <PageHeader title={`编辑用户 · ${user.username}`} description={user.email} />
      <p className="mb-3 text-xs text-fg-2">
        <Link href={`/staff/classes/history?user_id=${String(user.id)}`} className="text-accent hover:underline">
          查看该用户的等级历史 →
        </Link>
      </p>
      <UserForm mode="edit" user={user} classes={classes} permissions={bootstrap.permissions} />
      <div className="mt-5"><UserWarnings key={user.id} userId={user.id} initial={warnings}
        canIssue={bootstrap.permissions.includes("staff.user_warn") && bootstrap.me.id !== user.id}
        canSettle={bootstrap.permissions.includes("staff.user_warn")} /></div>
    </>
  );
}
