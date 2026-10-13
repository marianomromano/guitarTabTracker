import { redirect } from "next/navigation";

function safeReturnPath(value?: string) {
  if (!value) return "/library";
  if (value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  try {
    const url = new URL(value);
    if (url.pathname.startsWith("/") && !url.pathname.startsWith("//")) {
      return `${url.pathname}${url.search}`;
    }
  } catch {
    // ignore invalid URLs
  }
  return "/library";
}

export default async function LoginAliasPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; redirect_url?: string }>;
}) {
  const params = await searchParams;
  const next = safeReturnPath(params.redirect_url ?? params.callbackUrl);
  redirect(`/sign-in?redirect_url=${encodeURIComponent(next)}`);
}
