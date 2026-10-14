"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Guitar, Library, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function Nav({
  isSignedIn,
  isDemo,
}: {
  isSignedIn: boolean;
  isDemo: boolean;
}) {
  const pathname = usePathname();
  const inApp =
    pathname !== "/" &&
    !pathname.startsWith("/sign-in") &&
    !pathname.startsWith("/sign-up") &&
    !pathname.startsWith("/sso-callback");
  const homeHref = isSignedIn || isDemo ? "/library" : "/";

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
        <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center gap-3 px-4">
          <Link
            href={homeHref}
            className="flex min-h-12 items-center gap-2 text-gold"
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-gold/15">
              <Guitar className="size-6" />
            </span>
            <span className="font-heading text-base tracking-[0.22em] uppercase">
              TabShelf
            </span>
          </Link>
          <nav className="ml-3 hidden items-center gap-2 text-base text-muted-foreground md:flex">
            {inApp ? (
              <>
                <Link
                  href="/library"
                  className={
                    pathname === "/library"
                      ? "inline-flex min-h-12 items-center px-3 text-foreground"
                      : "inline-flex min-h-12 items-center px-3 hover:text-foreground"
                  }
                >
                  Library
                </Link>
                <Link
                  href="/search"
                  className={
                    pathname.startsWith("/search")
                      ? "inline-flex min-h-12 items-center px-3 text-foreground"
                      : "inline-flex min-h-12 items-center px-3 hover:text-foreground"
                  }
                >
                  Find tabs
                </Link>
              </>
            ) : null}
            <Link
              href="/tuner"
              className={
                pathname.startsWith("/tuner")
                  ? "inline-flex min-h-12 items-center px-3 text-foreground"
                  : "inline-flex min-h-12 items-center px-3 hover:text-foreground"
              }
            >
              Tuner
            </Link>
          </nav>
          {inApp ? (
            <form
              action="/search"
              method="get"
              className="ml-auto hidden max-w-md flex-1 items-center gap-2 md:flex"
            >
              <label className="flex h-12 flex-1 items-center gap-2 rounded-lg border border-input bg-black/20 px-3">
                <Search className="size-5 shrink-0 text-muted-foreground" />
                <Input
                  type="search"
                  name="q"
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
          {isSignedIn ? (
            <form action="/api/sign-out" method="post">
              <Button type="submit" size="sm" variant={inApp ? "outline" : "default"}>
                Sign out
              </Button>
            </form>
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
        "flex min-h-16 flex-col items-center justify-center gap-1 text-xs tracking-wide uppercase",
        active ? "text-gold" : "text-muted-foreground",
      )}
    >
      <Icon className="size-6" />
      {label}
    </Link>
  );
}
