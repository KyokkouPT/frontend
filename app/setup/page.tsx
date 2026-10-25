import { redirect } from "next/navigation";
import { SetupWizard } from "@/components/setup-wizard";
import { getSetupStatus } from "@/lib/setup";

export const dynamic = "force-dynamic";

export const metadata = { title: "安装站点" };

export default async function SetupPage() {
  const status = await getSetupStatus();
  if (!status.requires_setup) redirect("/");

  return (
    <main className="grid min-h-dvh place-items-center bg-surface-2 px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <p className="text-xs font-medium tracking-[0.2em] text-accent uppercase">KyokkouPT</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em]">安装站点</h1>
          <p className="mt-1 text-sm text-fg-1">
            数据库为空，先创建站点与第一个管理员账号；完成后会自动登录。
          </p>
        </div>
        <SetupWizard />
      </div>
    </main>
  );
}
