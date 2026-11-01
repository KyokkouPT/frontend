import type { Metadata } from "next";
import type { InvitePreview } from "@kyokkou/contracts";
import { getBootstrap } from "@/lib/bootstrap";
import { serverFetch } from "@/lib/api/server";
import { SignupForm } from "@/components/signup-form";

export const metadata: Metadata = { title: "注册" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawInvite = Array.isArray(params.invite) ? params.invite[0] : params.invite;
  const inviteCode = typeof rawInvite === "string" ? rawInvite.toUpperCase() : "";
  const bootstrap = await getBootstrap();

  let preview: InvitePreview | null = null;
  if (inviteCode) {
    try {
      preview = await serverFetch<InvitePreview>(
        `/api/v1/invites/${encodeURIComponent(inviteCode)}`,
      );
    } catch {
      preview = null;
    }
  }

  return (
    <SignupForm
      registration={bootstrap?.site.registration ?? null}
      inviteCode={inviteCode}
      boundEmail={preview?.valid ? preview.email : null}
      boundUsername={preview?.valid ? preview.username : null}
    />
  );
}
