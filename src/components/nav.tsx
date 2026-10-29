"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Guitar, Library, Search, Settings } from "lucide-react";
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
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 shadow-sm pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex min-h-24 max-w-screen-2xl flex-wrap items-center gap-3 px-4 py-3 lg:px-6">
          <Link
            href={homeHref}
            className="flex min-h-16 shrink-0 items-center gap-3 rounded-xl pr-2 text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            <span className="flex size-14 items-center justify-center rounded-full bg-gold/15">
              <Guitar className="size-6" />
            </span>
            <span className="font-heading text-lg tracking-[0.18em] uppercase">
              TabShelf
            </span>
          </Link>
          <nav className="hidden shrink-0 items-center gap-3 text-lg font-medium md:flex">
            {inApp ? (
              <>
                <Link
                  href="/library"
                  className={
                    pathname === "/library"
                      ? "inline-flex min-h-16 items-center justify-center rounded-xl bg-accent px-5 text-primary ring-2 ring-primary/30 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                      : "inline-flex min-h-16 items-center justify-center rounded-xl bg-card px-5 text-foreground ring-1 ring-border hover:bg-accent/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                  }
                >
                  Library
                </Link>
                <Link
                  href="/search"
                  className={
                    pathname.startsWith("/search")
                      ? "inline-flex min-h-16 items-center justify-center rounded-xl bg-accent px-5 text-primary ring-2 ring-primary/30 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                      : "inline-flex min-h-16 items-center justify-center rounded-xl bg-card px-5 text-foreground ring-1 ring-border hover:bg-accent/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
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
                  ? "inline-flex min-h-16 items-center justify-center rounded-xl bg-accent px-5 text-primary ring-2 ring-primary/30 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                  : "inline-flex min-h-16 items-center justify-center rounded-xl bg-card px-5 text-foreground ring-1 ring-border hover:bg-accent/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              }
            >
              Tuner
            </Link>
            {inApp ? (
              <Link
                href="/settings"
                className={
                  pathname.startsWith("/settings")
                    ? "inline-flex min-h-16 items-center justify-center rounded-xl bg-accent px-5 text-primary ring-2 ring-primary/30 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                    : "inline-flex min-h-16 items-center justify-center rounded-xl bg-card px-5 text-foreground ring-1 ring-border hover:bg-accent/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                }
              >
                Settings
              </Link>
            ) : null}
          </nav>
          {inApp ? (
            <form
              action="/search"
              method="get"
              className="ml-auto hidden min-w-64 flex-1 items-center gap-3 md:flex"
            >
              <label className="flex h-16 min-w-0 flex-1 items-center gap-2 rounded-lg border border-input bg-card px-3">
                <Search className="size-5 shrink-0 text-muted-foreground" />
                <Input
                  type="search"
                  name="q"
                  placeholder="Find tabs..."
                  aria-label="Find tabs"
                  className="h-full text-lg md:text-lg border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent"
                />
              </label>
              <Button type="submit" size="lg" className="h-16 px-6 text-lg md:h-16 bg-gold text-black hover:bg-gold/90">
                Search
              </Button>
            </form>
          ) : (
            <div className="ml-auto" />
          )}
          {isDemo ? (
            <Badge variant="outline" className="ml-auto border-gold/40 text-primary md:ml-0">
              Demo
            </Badge>
          ) : inApp ? (
            <div className="ml-auto md:hidden" />
          ) : null}
          {isSignedIn ? (
            <form action="/api/sign-out" method="post">
              <Button type="submit" size="lg" className="h-16 px-6 text-lg md:h-16" variant={inApp ? "outline" : "default"}>
                Sign out
              </Button>
            </form>
          ) : (
            <Button
              asChild
              size="lg"
              variant={inApp ? "outline" : "default"}
              className={cn("h-16 px-6 text-lg md:h-16", !inApp && "bg-gold text-black hover:bg-gold/90")}
            >
              <Link href="/sign-in">{isDemo ? "Save shelf" : "Sign in"}</Link>
            </Button>
          )}
        </div>
      </header>
      {inApp ? (
        <nav
          data-app-nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
        >
          <div className="grid grid-cols-4">
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
            <MobileNavLink
              href="/settings"
              label="Settings"
              icon={Settings}
              active={pathname.startsWith("/settings")}
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
        "flex min-h-16 flex-col items-center justify-center gap-1 text-sm font-medium tracking-wide",
        active ? "bg-accent text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className="size-6" />
      {label}
    </Link>
  );
}
