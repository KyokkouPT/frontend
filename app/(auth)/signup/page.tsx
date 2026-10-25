import type { Metadata } from "next";
import { getBootstrap } from "@/lib/bootstrap";
import { SignupForm } from "@/components/signup-form";

export const metadata: Metadata = { title: "注册" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.invite) ? params.invite[0] : params.invite;
  const bootstrap = await getBootstrap();

  return (
    <SignupForm
      registration={bootstrap?.site.registration ?? null}
      inviteCode={typeof raw === "string" ? raw.toUpperCase() : ""}
    />
  );
}
