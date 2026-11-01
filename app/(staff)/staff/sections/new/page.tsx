import { redirect } from "next/navigation";
import { getBootstrap } from "@/lib/bootstrap";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { SectionForm } from "@/components/section-form";
import { Panel } from "@/components/ui/panel";

export const dynamic = "force-dynamic";

export const metadata = { title: "新建分区" };

export default async function NewSectionPage() {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect("/login?next=/staff/sections/new");
  if (!bootstrap.permissions.includes("staff.settings")) {
    return (
      <Panel title="无权访问">
        <Notice tone="warn">只有管理员可以创建分区。</Notice>
      </Panel>
    );
  }

  return (
    <>
      <PageHeader title="新建分区" description="创建后可继续编辑；分区标识用于 URL，创建后不可修改。" />
      <SectionForm mode="create" />
    </>
  );
}
