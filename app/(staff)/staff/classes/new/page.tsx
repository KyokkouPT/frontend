import { redirect } from "next/navigation";
import { getBootstrap } from "@/lib/bootstrap";
import { Notice } from "@/components/notice";
import { Panel } from "@/components/ui/panel";

export const dynamic = "force-dynamic";

export const metadata = { title: "新建等级" };

export default async function NewClassPage() {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect("/login?next=/staff/classes/new");
  if (!bootstrap.permissions.includes("staff.classes")) {
    return (
      <Panel title="无权访问">
        <Notice tone="warn">当前账号没有等级管理权限。</Notice>
      </Panel>
    );
  }

  redirect("/staff/classes");
}
