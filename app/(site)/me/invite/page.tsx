import { redirect } from "next/navigation";
import type { InvitesResponse } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { InviteManager } from "@/components/invite-manager";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/ui/panel";

export const dynamic = "force-dynamic";

export const metadata = { title: "邀请" };

export default async function InvitePage() {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect("/login?next=/me/invite");

  let data: InvitesResponse;
  try {
    data = await serverFetch<InvitesResponse>("/api/v1/me/invites");
  } catch (error) {
    const message =
      error instanceof ServerFetchError
        ? `后端返回 ${String(error.status)}：${error.message}`
        : error instanceof Error
          ? error.message
          : "无法连接后端";
    return (
      <>
        <PageHeader title="邀请" description="生成一次性邀请码，邀请朋友注册。" />
        <Panel title="邀请码加载失败">
          <Notice tone="warn">{message}</Notice>
        </Panel>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="邀请"
        description="邀请码 30 天内有效；注册成功后邀请人会收到站内通知。"
      />
      <Panel title="我的邀请码">
        <InviteManager
          initial={data}
          requireEmail={bootstrap.site.registration.invite_require_email}
        />
      </Panel>
    </>
  );
}
