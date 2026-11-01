import { redirect } from "next/navigation";
import type { ClassesResponse, ClassNotificationTemplates, ClassRulesSettings } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { ClassRulesForm } from "@/components/class-rules-form";
import { Panel } from "@/components/ui/panel";

export const dynamic = "force-dynamic";

export const metadata = { title: "等级规则" };

export default async function ClassRulesPage() {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect("/login?next=/staff/classes/rules");
  if (!bootstrap.permissions.includes("staff.classes")) {
    return (
      <Panel title="无权访问">
        <Notice tone="warn">当前账号没有等级规则管理权限。</Notice>
      </Panel>
    );
  }

  let rules: ClassRulesSettings;
  let templates: ClassNotificationTemplates;
  let classes: ClassesResponse["items"] = [];
  try {
    [rules, templates, { items: classes }] = await Promise.all([
      serverFetch<ClassRulesSettings>("/api/v1/staff/classes/rules"),
      serverFetch<ClassNotificationTemplates>("/api/v1/staff/classes/notifications"),
      serverFetch<ClassesResponse>("/api/v1/staff/classes"),
    ]);
  } catch (error) {
    const message =
      error instanceof ServerFetchError
        ? `后端返回 ${String(error.status)}：${error.message}`
        : error instanceof Error
          ? error.message
          : "无法连接后端";
    return (
      <Panel title="规则加载失败">
        <Notice tone="warn">{message}</Notice>
      </Panel>
    );
  }

  return (
    <>
      <PageHeader
        title="等级规则"
        description="分享率矩阵默认启用；通知模板支持占位符。重算调度在站点设置中配置。"
      />
      <ClassRulesForm initialRules={rules} initialTemplates={templates} classes={classes} />
    </>
  );
}
