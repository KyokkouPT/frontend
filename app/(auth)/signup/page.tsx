import type { Metadata } from "next";
import { getBootstrap } from "@/lib/bootstrap";
import { SignupForm } from "@/components/signup-form";

export const metadata: Metadata = { title: "注册" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string | string[]; email?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawInvite = Array.isArray(params.invite) ? params.invite[0] : params.invite;
  const rawEmail = Array.isArray(params.email) ? params.email[0] : params.email;
  const bootstrap = await getBootstrap();

  return (
    <SignupForm
      registration={bootstrap?.site.registration ?? null}
      inviteCode={typeof rawInvite === "string" ? rawInvite.toUpperCase() : ""}
      initialEmail={typeof rawEmail === "string" ? rawEmail : ""}
    />
  );
}
