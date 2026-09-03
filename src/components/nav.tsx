"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import dynamic from "next/dynamic";
import { Guitar, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ClerkUserButton = dynamic(
  () => import("@/components/clerk-user-button").then((mod) => mod.ClerkUserButton),
  { ssr: false },
);

export function Nav({ clerkEnabled }: { clerkEnabled: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const next = query.trim();
    if (!next) {
      router.push("/search");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(next)}`);
  }

  if (pathname.startsWith("/tab/")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#12100c]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2 text-gold">
          <span className="flex size-8 items-center justify-center rounded-full bg-gold/15">
            <Guitar className="size-4" />
          </span>
          <span className="font-heading text-sm tracking-[0.22em] uppercase">
            TabShelf
          </span>
        </Link>
        <nav className="ml-4 hidden items-center gap-4 text-sm text-muted-foreground sm:flex">
          <Link
            href="/"
            className={pathname === "/" ? "text-foreground" : "hover:text-foreground"}
          >
            Library
          </Link>
          <Link
            href="/search"
            className={
              pathname.startsWith("/search")
                ? "text-foreground"
                : "hover:text-foreground"
            }
          >
            Find tabs
          </Link>
        </nav>
        <form onSubmit={onSearch} className="ml-auto flex max-w-md flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find tabs..."
              className="h-9 bg-black/20 pl-8"
            />
          </div>
          <Button type="submit" size="sm" className="bg-gold text-black hover:bg-gold/90">
            Search
          </Button>
        </form>
        {clerkEnabled ? (
          <ClerkUserButton />
        ) : (
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Local library
          </span>
        )}
      </div>
    </header>
  );
}
