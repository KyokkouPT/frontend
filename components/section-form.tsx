"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { StaffSectionItem } from "@kyokkou/contracts";
import { ApiClientError, apiFetch, apiPost } from "@/lib/api/client";
import { Button } from "./ui/button";
import { Field, Input, Select, Textarea } from "./ui/field";
import { Notice } from "./notice";
import { Panel } from "./ui/panel";

function errorText(error: unknown, fallback: string): string {
  return error instanceof ApiClientError ? (error.fields?.[0]?.message ?? error.message) : fallback;
}

/** 新建与编辑共用同一个表单布局。 */
export function SectionForm({
  mode,
  section,
}: {
  mode: "create" | "edit";
  section?: StaffSectionItem;
}) {
  const router = useRouter();
  const [slug, setSlug] = useState(section?.slug ?? "");
  const [name, setName] = useState(section?.name ?? "");
  const [reviewMode, setReviewMode] = useState(section?.review_mode ?? "pre");
  const [order, setOrder] = useState(String(section?.display_order ?? 0));
  const [charter, setCharter] = useState(section?.charter ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      if (mode === "create") {
        await apiPost("/api/v1/staff/sections", {
          slug: slug.trim(),
          name: name.trim(),
          review_mode: reviewMode,
          display_order: Number(order) || 0,
          charter: charter.trim() || undefined,
        });
      } else if (section) {
        await apiFetch(`/api/v1/staff/sections/${encodeURIComponent(section.slug)}`, {
          method: "PUT",
          body: JSON.stringify({
            name: name.trim(),
            review_mode: reviewMode,
            display_order: Number(order) || 0,
            charter,
          }),
        });
      }
      router.push("/staff/sections");
      router.refresh();
    } catch (caught) {
      setError(errorText(caught, mode === "create" ? "创建分区失败" : "保存失败"));
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-lg border border-line bg-surface-1 p-5">
      {error && <Notice tone="warn">{error}</Notice>}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="分区标识（slug）" htmlFor="section-slug" required hint="小写字母/数字/连字符；创建后不可修改">
          <Input
            id="section-slug"
            value={slug}
            onChange={(event) =>
              setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
            }
            required={mode === "create"}
            disabled={mode === "edit"}
            placeholder="例如 anime"
          />
        </Field>

        <Field label="名称" htmlFor="section-name" required>
          <Input
            id="section-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            placeholder="例如 动画"
          />
        </Field>

        <Field label="审核模式" htmlFor="section-review-mode">
          <Select
            id="section-review-mode"
            value={reviewMode}
            onChange={(event) => setReviewMode(event.target.value)}
          >
            <option value="pre">pre（发布前审核）</option>
            <option value="review">review</option>
            <option value="staff">staff</option>
          </Select>
        </Field>

        <Field label="排序" htmlFor="section-order">
          <Input
            id="section-order"
            type="number"
            value={order}
            onChange={(event) => setOrder(event.target.value)}
          />
        </Field>

        <Field label="公告" htmlFor="section-charter">
          <Textarea
            id="section-charter"
            value={charter}
            onChange={(event) => setCharter(event.target.value)}
            placeholder="命名规范、允许的内容等"
          />
        </Field>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="primary" type="submit" disabled={pending}>
          {pending ? "保存中…" : mode === "create" ? "创建分区" : "保存修改"}
        </Button>
        <Link
          href="/staff/sections"
          className="inline-flex h-10 items-center rounded-sm border border-line bg-surface-1 px-4 text-sm text-fg-1 transition-colors hover:border-line-strong hover:text-fg-0"
        >
          取消
        </Link>
      </div>
    </form>
  );
}

/** 编辑页的分类管理：列出已有分类并可新增。 */
export function CategoryManager({ section }: { section: StaffSectionItem }) {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      await apiPost("/api/v1/staff/categories", {
        section_slug: section.slug,
        slug: slug.trim(),
        name: name.trim(),
      });
      setMessage(`已添加分类「${name.trim()}」`);
      setSlug("");
      setName("");
      router.refresh();
    } catch (caught) {
      setError(errorText(caught, "添加分类失败"));
    } finally {
      setPending(false);
    }
  }

  return (
    <Panel title="分类" description={`分区「${section.name}」下的分类，供发布种子时选择`}>
      {error && <Notice tone="warn">{error}</Notice>}
      {message && <Notice tone="info">{message}</Notice>}

      {section.categories.length === 0 ? (
        <p className="text-sm text-fg-2">还没有分类。</p>
      ) : (
        <ul className="mb-4 grid gap-1.5">
          {section.categories.map((category) => (
            <li key={category.slug} className="flex items-center gap-2 text-sm">
              <b className="font-medium">{category.name}</b>
              <span className="font-mono text-2xs text-fg-2">{category.slug}</span>
              <span className="ml-auto text-2xs text-fg-2">排序 {category.display_order}</span>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="grid gap-3 border-t border-line pt-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="分类标识（slug）" htmlFor="category-slug" required>
            <Input
              id="category-slug"
              value={slug}
              onChange={(event) =>
                setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
              }
              required
              placeholder="例如 anime-sub"
            />
          </Field>
          <Field label="分类名称" htmlFor="category-name" required>
            <Input
              id="category-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              placeholder="例如 字幕"
            />
          </Field>
        </div>
        <div>
          <Button variant="primary" type="submit" disabled={pending}>
            {pending ? "添加中…" : "添加分类"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
