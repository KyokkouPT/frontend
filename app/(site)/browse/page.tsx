import type { TorrentListResponse } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { ServerFetchError, serverFetch } from "@/lib/api/server";
import { BrowseExplorer, type BrowseFilters } from "@/components/browse-explorer";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/ui/panel";

export const dynamic = "force-dynamic";

export const metadata = { title: "浏览" };

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters: BrowseFilters = {
    section: first(params.section),
    category: first(params.category),
    promo: first(params.promo),
    q: first(params.q),
    sort: first(params.sort) || "added_desc",
    fields: Object.fromEntries(
      Object.entries(params)
        .filter(([key]) => key.startsWith("field."))
        .map(([key, value]) => [key.slice("field.".length), first(value)]),
    ),
  };

  const query = new URLSearchParams({ limit: "20", sort: filters.sort });
  if (filters.section) query.set("section", filters.section);
  if (filters.category) query.set("category", filters.category);
  if (filters.promo) query.set("promo", filters.promo);
  if (filters.q) query.set("q", filters.q);
  for (const [key, value] of Object.entries(filters.fields)) {
    if (value) query.set(`field.${key}`, value);
  }

  const bootstrap = await getBootstrap();
  let initial: TorrentListResponse;
  try {
    initial = await serverFetch<TorrentListResponse>(`/api/v1/torrents?${query.toString()}`);
  } catch (error) {
    const message =
      error instanceof ServerFetchError
        ? `后端返回 ${String(error.status)}：${error.message}`
        : error instanceof Error
          ? error.message
          : "无法连接后端";
    return (
      <>
        <PageHeader title="浏览" description="按分区、促销、字段筛选与排序" />
        <Panel title="列表加载失败">
          <Notice tone="warn">{message}</Notice>
        </Panel>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="浏览"
        count={`${String(initial.items.length)} 条`}
        description="支持分区、分类、促销、字段组合筛选；排序与分页由服务端处理。"
      />
      <BrowseExplorer
        initial={initial}
        sections={bootstrap?.sections ?? []}
        initialFilters={filters}
        canDownload={Boolean(bootstrap?.me)}
      />
    </>
  );
}
