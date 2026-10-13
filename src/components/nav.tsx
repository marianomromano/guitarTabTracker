"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import dynamic from "next/dynamic";
import { Guitar, Library, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ClerkUserButton = dynamic(
  () => import("@/components/clerk-user-button").then((mod) => mod.ClerkUserButton),
  { ssr: false },
);

export function Nav({
  clerkEnabled,
  isSignedIn,
  isDemo,
}: {
  clerkEnabled: boolean;
  isSignedIn: boolean;
  isDemo: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inApp =
    pathname !== "/" &&
    !pathname.startsWith("/sign-in") &&
    !pathname.startsWith("/sign-up") &&
    !pathname.startsWith("/sso-callback");
  const homeHref = isSignedIn || isDemo ? "/library" : "/";

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const next = query.trim();
    if (!next) {
      router.push("/search");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(next)}`);
  }

  if (
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/sso-callback")
  ) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#12100c]/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 md:h-14">
          <Link
            href={homeHref}
            className="flex min-h-11 items-center gap-2 text-gold"
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-gold/15 md:size-8">
              <Guitar className="size-5 md:size-4" />
            </span>
            <span className="font-heading text-sm tracking-[0.22em] uppercase">
              TabShelf
            </span>
          </Link>
          <nav className="ml-3 hidden items-center gap-4 text-sm text-muted-foreground md:flex">
            {inApp ? (
              <>
                <Link
                  href="/library"
                  className={
                    pathname === "/library" ? "text-foreground" : "hover:text-foreground"
                  }
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
              </>
            ) : null}
            <Link
              href="/tuner"
              className={
                pathname.startsWith("/tuner") ? "text-foreground" : "hover:text-foreground"
              }
            >
              Tuner
            </Link>
          </nav>
          {inApp ? (
            <form
              onSubmit={onSearch}
              className="ml-auto hidden max-w-md flex-1 items-center gap-2 md:flex"
            >
              <label className="flex h-9 flex-1 items-center gap-2 rounded-lg border border-input bg-black/20 px-2.5">
                <Search className="size-3.5 shrink-0 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Find tabs..."
                  className="h-full border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent"
                />
              </label>
              <Button type="submit" size="sm" className="bg-gold text-black hover:bg-gold/90">
                Search
              </Button>
            </form>
          ) : (
            <div className="ml-auto" />
          )}
          {isDemo ? (
            <Badge variant="outline" className="ml-auto border-gold/40 text-gold md:ml-0">
              Demo
            </Badge>
          ) : inApp ? (
            <div className="ml-auto md:hidden" />
          ) : null}
          {isSignedIn && clerkEnabled ? (
            <ClerkUserButton />
          ) : (
            <Button
              asChild
              size="sm"
              variant={inApp ? "outline" : "default"}
              className={inApp ? "" : "bg-gold text-black hover:bg-gold/90"}
            >
              <Link href="/sign-in">{isDemo ? "Save shelf" : "Sign in"}</Link>
            </Button>
          )}
        </div>
      </header>
      {inApp ? (
        <nav
          data-app-nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#12100c]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
        >
          <div className="grid grid-cols-3">
            <MobileNavLink
              href="/library"
              label="Library"
              icon={Library}
              active={pathname === "/library" || pathname.startsWith("/album/") || pathname.startsWith("/artist/")}
            />
            <MobileNavLink
              href="/search"
              label="Find"
              icon={Search}
              active={pathname.startsWith("/search")}
            />
            <MobileNavLink
              href="/tuner"
              label="Tuner"
              icon={Guitar}
              active={pathname.startsWith("/tuner")}
            />
          </div>
        </nav>
      ) : null}
    </>
  );
}

function MobileNavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof Library;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] tracking-wide uppercase",
        active ? "text-gold" : "text-muted-foreground",
      )}
    >
      <Icon className="size-5" />
      {label}
    </Link>
  );
}
