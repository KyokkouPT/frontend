import { redirect } from "next/navigation";
import { getBootstrap } from "@/lib/bootstrap";
import { PageHeader } from "@/components/page-header";
import { UploadForm } from "@/components/upload-form";
import { Panel } from "@/components/ui/panel";

export const dynamic = "force-dynamic";

export const metadata = { title: "发布" };

export default async function UploadPage() {
  const bootstrap = await getBootstrap();
  if (!bootstrap?.me) redirect("/login?next=/upload");

  return (
    <>
      <PageHeader
        title="发布种子"
        description="上传 .torrent，填写分区与字段；服务端会解析 info_hash、文件树并进入审核流程。"
      />
      {bootstrap.sections.length === 0 ? (
        <Panel title="暂无可发布的分区">
          <p className="text-sm text-fg-2">站点尚未配置分区，请先由 Staff 完成分区设置。</p>
        </Panel>
      ) : (
        <UploadForm sections={bootstrap.sections} />
      )}
    </>
  );
}
