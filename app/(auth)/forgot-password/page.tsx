import type { Metadata } from "next";
import { getBootstrap } from "@/lib/bootstrap";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const metadata: Metadata = { title: "找回密码" };

export default async function ForgotPasswordPage() {
  const bootstrap = await getBootstrap();
  return <ForgotPasswordForm enabled={bootstrap?.site.password_reset.enabled ?? false} />;
}