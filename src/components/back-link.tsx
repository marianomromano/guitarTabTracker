import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="mb-6 inline-flex min-h-14 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base font-medium text-foreground hover:bg-white/10"
    >
      <ArrowLeft className="size-6" />
      {children}
    </Link>
  );
}
