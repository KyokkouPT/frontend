import { redirect } from "next/navigation";
import { getBootstrap } from "@/lib/bootstrap";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { ClassSimulator } from "@/components/class-simulator";
import { Panel } from "@/components/ui/panel";

export const dynamic = "force-dynamic";

export const metadata = { title: "升降模拟" };

export default async function ClassSimulatePage() {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect("/login?next=/staff/classes/simulate");
  if (!bootstrap.permissions.includes("staff.class_simulate")) {
    return (
      <Panel title="无权访问">
        <Notice tone="warn">当前账号没有升降模拟权限（staff.class_simulate）。</Notice>
      </Panel>
    );
  }

  return (
    <>
      <PageHeader
        title="升降模拟"
        description="选择用户 → 查看下一次自动重算的判定结果；模拟只读，不会写库或发通知。"
      />
      <ClassSimulator />
    </>
  );
}
