"use client";

import { useCallback, useState } from "react";
import { X } from "lucide-react";
import type { Section, TorrentListResponse } from "@kyokkou/contracts";
import { ApiClientError, apiFetch } from "@/lib/api/client";
import { Button } from "./ui/button";
import { EmptyState } from "./ui/empty-state";
import { Field, Input, Select } from "./ui/field";
import { Notice } from "./notice";
import { Panel } from "./ui/panel";
import { TorrentRow } from "./torrent-row";

export type BrowseFilters = {
  section: string;
  category: string;
  promo: string;
  q: string;
  sort: string;
  fields: Record<string, string>;
};

const SORTS = [
  ["added_desc", "最新发布"],
  ["seeders_desc", "做种最多"],
  ["size_desc", "体积最大"],
  ["completed_desc", "完成最多"],
] as const;

const PROMOS = [
  ["", "全部促销"],
  ["free", "免费"],
  ["2x", "双倍"],
  ["50", "五折"],
  ["30", "三折"],
] as const;

function buildQuery(filters: BrowseFilters, cursor?: string): string {
  const params = new URLSearchParams({ limit: "20", sort: filters.sort });
  if (filters.section) params.set("section", filters.section);
  if (filters.category) params.set("category", filters.category);
  if (filters.promo) params.set("promo", filters.promo);
  if (filters.q.trim()) params.set("q", filters.q.trim());
  for (const [key, value] of Object.entries(filters.fields)) {
    if (value) params.set(`field.${key}`, value);
  }
  if (cursor) params.set("cursor", cursor);
  return params.toString();
}

export function BrowseExplorer({
  initial,
  sections,
  initialFilters,
  canDownload,
}: {
  initial: TorrentListResponse;
  sections: Section[];
  initialFilters: BrowseFilters;
  canDownload: boolean;
}) {
  const [items, setItems] = useState(initial.items);
  const [cursor, setCursor] = useState<string | null>(initial.next_cursor);
  const [filters, setFilters] = useState<BrowseFilters>(initialFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeSection = sections.find((section) => section.slug === filters.section);
  const filterableFields = activeSection?.fields.filter((field) => field.filterable && field.type === "select") ?? [];
  const categories = activeSection?.categories ?? sections.flatMap((section) => section.categories);

  const load = useCallback(async (next: BrowseFilters, nextCursor?: string, append = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<TorrentListResponse>(`/api/v1/torrents?${buildQuery(next, nextCursor)}`);
      setItems((previous) => (append ? [...previous, ...data.items] : data.items));
      setCursor(data.next_cursor);
      setFilters(next);
    } catch (loadError) {
      setError(loadError instanceof ApiClientError ? loadError.message : "加载失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }, []);

  function apply(patch: Partial<BrowseFilters>) {
    void load({ ...filters, ...patch });
  }

  function applyField(key: string, value: string) {
    void load({ ...filters, fields: { ...filters.fields, [key]: value } });
  }

  function clearAll() {
    void load({ section: "", category: "", promo: "", q: "", sort: "added_desc", fields: {} });
  }

  const chips: { label: string; onRemove: () => void }[] = [];
  if (filters.section) {
    chips.push({ label: activeSection?.name ?? filters.section, onRemove: () => apply({ section: "", category: "", fields: {} }) });
  }
  if (filters.category) {
    chips.push({ label: categories.find((category) => category.slug === filters.category)?.name ?? filters.category, onRemove: () => apply({ category: "" }) });
  }
  if (filters.promo) {
    chips.push({ label: `促销 ${filters.promo}`, onRemove: () => apply({ promo: "" }) });
  }
  if (filters.q) {
    chips.push({ label: `搜索：${filters.q}`, onRemove: () => apply({ q: "" }) });
  }
  for (const [key, value] of Object.entries(filters.fields)) {
    if (!value) continue;
    const fieldDef = activeSection?.fields.find((field) => field.key === key);
    chips.push({ label: `${fieldDef?.label ?? key}：${value}`, onRemove: () => applyField(key, "") });
  }

  return (
    <div className="grid gap-4">
      <Panel title="筛选" description="分区、分类、促销、字段与排序都可组合">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="分区" htmlFor="browse-section">
            <Select
              id="browse-section"
              value={filters.section}
              onChange={(event) => apply({ section: event.target.value, category: "", fields: {} })}
            >
              <option value="">全部分区</option>
              {sections.map((section) => (
                <option key={section.slug} value={section.slug}>
                  {section.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="分类" htmlFor="browse-category">
            <Select
              id="browse-category"
              value={filters.category}
              onChange={(event) => apply({ category: event.target.value })}
            >
              <option value="">全部分类</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="促销" htmlFor="browse-promo">
            <Select
              id="browse-promo"
              value={filters.promo}
              onChange={(event) => apply({ promo: event.target.value })}
            >
              {PROMOS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="排序" htmlFor="browse-sort">
            <Select
              id="browse-sort"
              value={filters.sort}
              onChange={(event) => apply({ sort: event.target.value })}
            >
              {SORTS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <form
          className="mt-3 flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            apply({ q: filters.q });
          }}
        >
          <Field label="搜索标题" htmlFor="browse-q" className="min-w-[220px] flex-1">
            <Input
              id="browse-q"
              value={filters.q}
              placeholder="标题关键词，例如 Dune"
              onChange={(event) => setFilters((previous) => ({ ...previous, q: event.target.value }))}
            />
          </Field>
          <Button type="submit" variant="primary" className="h-10 md:h-[34px]">
            搜索
          </Button>
        </form>

        {filterableFields.length > 0 && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {filterableFields.map((fieldDef) => (
              <Field key={fieldDef.key} label={fieldDef.label} htmlFor={`browse-field-${fieldDef.key}`}>
                <Select
                  id={`browse-field-${fieldDef.key}`}
                  value={filters.fields[fieldDef.key] ?? ""}
                  onChange={(event) => applyField(fieldDef.key, event.target.value)}
                >
                  <option value="">全部</option>
                  {(fieldDef.options ?? []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </Field>
            ))}
          </div>
        )}

        {chips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {chips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={chip.onRemove}
                className="inline-flex items-center gap-1 rounded-pill border border-line bg-surface-2 px-2 py-0.5 text-2xs text-fg-1 hover:border-line-strong hover:text-fg-0"
              >
                {chip.label}
                <X className="size-3" />
              </button>
            ))}
            <button type="button" onClick={clearAll} className="text-2xs text-accent hover:underline">
              清除全部
            </button>
          </div>
        )}
      </Panel>

      {error && <Notice tone="warn">{error}</Notice>}

      {loading && items.length === 0 ? (
        <div className="grid gap-2" aria-busy="true">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-[76px] animate-pulse rounded-md border border-line bg-surface-1" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="没有匹配的种子"
          description="尝试放宽筛选条件，或清除全部筛选重新浏览。"
          actions={
            <Button onClick={clearAll} variant="default">
              清除筛选
            </Button>
          }
        />
      ) : (
        <div className="grid gap-2">
          {items.map((torrent) => (
            <TorrentRow key={torrent.id} torrent={torrent} canDownload={canDownload} />
          ))}
        </div>
      )}

      {cursor && (
        <div className="flex justify-center">
          <Button
            variant="default"
            disabled={loading}
            onClick={() => void load(filters, cursor, true)}
          >
            {loading ? "加载中…" : "加载更多"}
          </Button>
        </div>
      )}
    </div>
  );
}
