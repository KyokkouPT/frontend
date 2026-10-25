import type { Metadata } from "next";
import { getBootstrap } from "@/lib/bootstrap";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "登录" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.next) ? params.next[0] : params.next;
  // 只允许站内相对路径，避免开放重定向。
  const next = typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
  const bootstrap = await getBootstrap();

  return <LoginForm next={next} registration={bootstrap?.site.registration ?? null} />;
}
