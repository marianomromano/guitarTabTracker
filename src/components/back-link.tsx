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
      className="mb-6 inline-flex min-h-14 items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-base font-medium text-foreground hover:bg-accent"
    >
      <ArrowLeft className="size-6" />
      {children}
    </Link>
  );
}
