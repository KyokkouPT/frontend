import type { Metadata } from "next";
import { VerifyEmailPanel } from "@/components/verify-email-panel";

export const metadata: Metadata = { title: "验证邮箱" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  return <VerifyEmailPanel token={typeof token === "string" ? token : ""} />;
}
