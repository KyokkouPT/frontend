import { notFound, redirect } from "next/navigation";
import type { ClassesResponse, StaffUsersResponse } from "@kyokkou/contracts";
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

  let data: StaffUsersResponse;
  let classes: ClassesResponse["items"] = [];
  try {
    [data, { items: classes }] = await Promise.all([
      serverFetch<StaffUsersResponse>("/api/v1/staff/users"),
      serverFetch<ClassesResponse>("/api/v1/staff/users/classes"),
    ]);
  } catch (error) {
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
      <UserForm mode="edit" user={user} classes={classes} />
    </>
  );
}
