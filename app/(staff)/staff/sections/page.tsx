import Link from "next/link";
import { redirect } from "next/navigation";
import type { StaffSectionsResponse } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
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
        description="分区决定发布时可选的分类；分类至少一个才能上传种子。"
      />

      <div className="mb-4 flex justify-end">
        <Link
          href="/staff/sections/new"
          className="inline-flex h-10 items-center rounded-sm border border-accent bg-accent px-4 text-sm font-semibold text-accent-ink transition hover:brightness-110"
        >
          新建分区
        </Link>
      </div>

      <Panel flush>
        {data.items.length === 0 ? (
          <p className="p-4 text-sm text-fg-2">还没有分区，先新建一个。</p>
        ) : (
          <ul className="divide-y divide-line">
            {data.items.map((section) => (
              <li key={section.slug} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0">
                  <b className="text-sm font-semibold">{section.name}</b>
                  <span className="ml-2 font-mono text-2xs text-fg-2">{section.slug}</span>
                  <p className="mt-0.5 text-2xs text-fg-2">
                    审核模式 {section.review_mode} · {section.categories.length} 个分类
                  </p>
                </div>
                <Link
                  href={`/staff/sections/${encodeURIComponent(section.slug)}`}
                  className="ml-auto inline-flex h-9 items-center rounded-sm border border-line bg-surface-1 px-3 text-xs text-fg-1 transition-colors hover:border-line-strong hover:text-fg-0"
                >
                  编辑
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
