import { notFound, redirect } from "next/navigation";
import type { StaffSectionsResponse } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { CategoryManager, SectionForm } from "@/components/section-form";
import { Panel } from "@/components/ui/panel";

export const dynamic = "force-dynamic";

export const metadata = { title: "编辑分区" };

export default async function EditSectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect("/login?next=/staff/sections");
  if (!bootstrap.permissions.includes("staff.settings")) {
    return (
      <Panel title="无权访问">
        <Notice tone="warn">只有管理员可以编辑分区。</Notice>
      </Panel>
    );
  }

  const { slug } = await params;

  let data: StaffSectionsResponse;
  try {
    data = await serverFetch<StaffSectionsResponse>("/api/v1/staff/sections");
  } catch (error) {
    const message =
      error instanceof ServerFetchError
        ? `后端返回 ${String(error.status)}：${error.message}`
        : error instanceof Error
          ? error.message
          : "无法连接后端";
    return (
      <Panel title="分区加载失败">
        <Notice tone="warn">{message}</Notice>
      </Panel>
    );
  }

  const section = data.items.find((item) => item.slug === decodeURIComponent(slug));
  if (!section) notFound();

  return (
    <>
      <PageHeader title={`编辑分区 · ${section.name}`} description={section.slug} />
      <div className="grid gap-6">
        <SectionForm mode="edit" section={section} />
        <CategoryManager section={section} />
      </div>
    </>
  );
}
