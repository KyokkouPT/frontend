import { redirect } from "next/navigation";
import type { ClassesResponse } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { serverFetch } from "@/lib/api/server";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { UserForm } from "@/components/user-form";
import { Panel } from "@/components/ui/panel";

export const dynamic = "force-dynamic";

export const metadata = { title: "新建用户" };

export default async function NewUserPage() {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect("/login?next=/staff/users/new");
  if (!bootstrap.permissions.includes("staff.users")) {
    return (
      <Panel title="无权访问">
        <Notice tone="warn">当前账号没有用户管理权限。</Notice>
      </Panel>
    );
  }

  let classes: ClassesResponse["items"] = [];
  try {
    classes = (await serverFetch<ClassesResponse>("/api/v1/staff/users/classes")).items;
  } catch {
    classes = [];
  }

  return (
    <>
      <PageHeader title="新建用户" description="创建后可直接用该用户名与密码登录。" />
      <UserForm mode="create" classes={classes} permissions={bootstrap.permissions} />
    </>
  );
}
