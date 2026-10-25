import { redirect } from "next/navigation";
import type { StaffSectionsResponse } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { SectionEditor } from "@/components/staff-config";
import { Panel } from "@/components/ui/panel";

export const dynamic = "force-dynamic";

export const metadata = { title: "分区管理" };

export default async function StaffSectionsPage() {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect("/login?next=/staff/sections");
  if (!bootstrap.permissions.includes("staff.settings")) {
    return (
      <Panel title="无权访问">
        <Notice tone="warn">只有管理员可以修改分区与分类。</Notice>
      </Panel>
    );
  }

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

  return (
    <>
      <PageHeader
        title="分区管理"
        description="分区名称/排序/审核模式/公告；字段结构来自分区配置。保存写入审计（section.update）。"
      />
      <SectionEditor initial={data.items} />
    </>
  );
}
