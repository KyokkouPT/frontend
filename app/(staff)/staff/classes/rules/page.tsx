import { redirect } from "next/navigation";
import type {
  ClassesResponse,
  ClassNotificationTemplates,
  ClassRecoveryBandsResponse,
  ClassRulesSettings,
  ClassSchedulerResponse,
} from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { ClassRulesForm } from "@/components/class-rules-form";
import { ClassRecoveryBandsPanel } from "@/components/class-recovery-bands";
import { ClassSchedulerPanel } from "@/components/class-scheduler-panel";
import { Panel } from "@/components/ui/panel";

export const dynamic = "force-dynamic";

export const metadata = { title: "等级设置" };

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
  let scheduler: ClassSchedulerResponse;
  let recovery: ClassRecoveryBandsResponse;
  let classes: ClassesResponse["items"] = [];
  try {
    [rules, templates, scheduler, recovery, { items: classes }] = await Promise.all([
      serverFetch<ClassRulesSettings>("/api/v1/staff/classes/rules"),
      serverFetch<ClassNotificationTemplates>("/api/v1/staff/classes/notifications"),
      serverFetch<ClassSchedulerResponse>("/api/v1/staff/classes/scheduler"),
      serverFetch<ClassRecoveryBandsResponse>("/api/v1/staff/classes/recovery-bands"),
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
        title="等级设置"
        description="固定用户组升级/降级条件、受限恢复分段、通知模板与重算调度。"
      />
      <div className="grid gap-6">
        <ClassRulesForm initialRules={rules} initialTemplates={templates} classes={classes} />
        <ClassRecoveryBandsPanel initial={recovery.items} />
        <ClassSchedulerPanel initial={scheduler.settings} />
      </div>
    </>
  );
}
