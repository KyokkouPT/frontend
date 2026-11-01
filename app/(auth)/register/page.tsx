import { redirect } from "next/navigation";

export const metadata = { title: "注册" };

export default async function RegisterAliasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") query.set(key, value);
    else if (Array.isArray(value) && value[0]) query.set(key, value[0]);
  }
  redirect(`/signup${query.size > 0 ? `?${query.toString()}` : ""}`);
}
