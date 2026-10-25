"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Section, UploadResponse } from "@kyokkou/contracts";
import { ApiClientError, apiUpload } from "@/lib/api/client";
import { Button } from "./ui/button";
import { Field, Input, Select, Textarea } from "./ui/field";
import { Notice } from "./notice";
import { Panel } from "./ui/panel";

const MAX_BYTES = 5 * 1024 * 1024;

export function UploadForm({ sections }: { sections: Section[] }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [sectionSlug, setSectionSlug] = useState(sections[0]?.slug ?? "");
  const [categorySlug, setCategorySlug] = useState(sections[0]?.categories[0]?.slug ?? "");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [promo, setPromo] = useState("none");
  const [tags, setTags] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const section = sections.find((item) => item.slug === sectionSlug);
  const categories = section?.categories ?? [];
  const fields = section?.fields ?? [];

  function changeSection(slug: string) {
    const next = sections.find((item) => item.slug === slug);
    setSectionSlug(slug);
    setCategorySlug(next?.categories[0]?.slug ?? "");
    setFieldValues({});
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!file) {
      setError("请选择 .torrent 文件");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("种子文件不能超过 5MB");
      return;
    }

    setPending(true);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("section", sectionSlug);
      form.set("category", categorySlug);
      form.set("name", name);
      form.set("description", description);
      form.set("promo", promo);
      form.set("tags", tags);
      form.set("meta", JSON.stringify(fieldValues));

      const result = await apiUpload<UploadResponse>("/api/v1/torrents", form);
      router.push(`/me?uploaded=${result.status}&id=${String(result.id)}`);
      router.refresh();
    } catch (uploadError) {
      setError(
        uploadError instanceof ApiClientError
          ? (uploadError.fields?.[0]?.message ?? uploadError.message)
          : "上传失败，请稍后重试",
      );
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      <Panel title="种子文件" description="最大 5MB；info_hash 重复会被拒绝">
        <Field label=".torrent 文件" htmlFor="upload-file" required hint="上传后服务端会解析文件树与 info_hash">
          <Input
            id="upload-file"
            type="file"
            accept=".torrent,application/x-bittorrent"
            required
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="h-auto py-2"
          />
        </Field>
      </Panel>

      <Panel title="基本信息">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="分区" htmlFor="upload-section" required>
            <Select
              id="upload-section"
              value={sectionSlug}
              onChange={(event) => changeSection(event.target.value)}
              required
            >
              {sections.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="分类" htmlFor="upload-category" required>
            <Select
              id="upload-category"
              value={categorySlug}
              onChange={(event) => setCategorySlug(event.target.value)}
              required
            >
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="标题" htmlFor="upload-name" className="sm:col-span-2" hint="留空则使用 .torrent 里的 name">
            <Input
              id="upload-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="例如 Dune.Part.Two.2024.2160p.UHD.BluRay.x265-GROUP"
            />
          </Field>

          <Field label="促销" htmlFor="upload-promo">
            <Select id="upload-promo" value={promo} onChange={(event) => setPromo(event.target.value)}>
              <option value="none">无</option>
              <option value="free">免费</option>
              <option value="2x">双倍上传</option>
              <option value="50">五折</option>
              <option value="30">三折</option>
            </Select>
          </Field>

          <Field label="标签" htmlFor="upload-tags" hint="逗号分隔，最多 8 个">
            <Input
              id="upload-tags"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="中字,HDR"
            />
          </Field>

          <Field label="描述" htmlFor="upload-description" className="sm:col-span-2">
            <Textarea
              id="upload-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="规格、来源、字幕、修复说明等"
            />
          </Field>
        </div>
      </Panel>

      {fields.length > 0 && (
        <Panel
          title={`${section?.name ?? ""}分区字段`}
          description={section?.charter?.naming ? `命名规范：${section.charter.naming}` : "由分区配置驱动"}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((fieldDef) => (
              <Field
                key={fieldDef.key}
                label={fieldDef.label}
                htmlFor={`upload-field-${fieldDef.key}`}
                required={fieldDef.required}
                hint={fieldDef.hint}
              >
                {fieldDef.type === "select" && fieldDef.options ? (
                  <Select
                    id={`upload-field-${fieldDef.key}`}
                    value={fieldValues[fieldDef.key] ?? ""}
                    onChange={(event) =>
                      setFieldValues((previous) => ({ ...previous, [fieldDef.key]: event.target.value }))
                    }
                    required={fieldDef.required}
                  >
                    <option value="">请选择</option>
                    {fieldDef.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    id={`upload-field-${fieldDef.key}`}
                    value={fieldValues[fieldDef.key] ?? ""}
                    onChange={(event) =>
                      setFieldValues((previous) => ({ ...previous, [fieldDef.key]: event.target.value }))
                    }
                    required={fieldDef.required}
                  />
                )}
              </Field>
            ))}
          </div>
        </Panel>
      )}

      {error && <Notice tone="warn">{error}</Notice>}

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" size="lg" disabled={pending}>
          {pending ? "提交中…" : "提交发布"}
        </Button>
        <p className="text-xs text-fg-2">
          默认进入待审队列；Staff 权限或达到可信门限的发布者会直接通过。
        </p>
      </div>
    </form>
  );
}
