import { notFound, redirect } from "next/navigation";
import type { ClassesResponse } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { ClassForm } from "@/components/class-form";
import { Panel } from "@/components/ui/panel";

export const dynamic = "force-dynamic";

export const metadata = { title: "编辑等级" };

export default async function EditClassPage({ params }: { params: Promise<{ slug: string }> }) {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect("/login?next=/staff/classes");
  if (!bootstrap.permissions.includes("staff.classes")) {
    return (
      <Panel title="无权访问">
        <Notice tone="warn">当前账号没有等级管理权限。</Notice>
      </Panel>
    );
  }

  const { slug } = await params;
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

  const item = data.items.find((entry) => entry.slug === slug);
  if (!item) notFound();

  return (
    <>
      <PageHeader title={`编辑等级 · ${item.name}`} description={`slug: ${item.slug} · rank: ${String(item.rank)}`} />
      <ClassForm mode="edit" item={item} />
    </>
  );
}
