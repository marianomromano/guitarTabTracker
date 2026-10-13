import Link from "next/link";
import { Disc3, Library, Search } from "lucide-react";
import { startDemoAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

const SAMPLE_RECORDS = [
  { title: "IV", artist: "Led Zeppelin", tone: "from-amber-900 to-stone-950" },
  { title: "La Sexorcisto", artist: "White Zombie", tone: "from-red-950 to-zinc-950" },
  { title: "Ten", artist: "Pearl Jam", tone: "from-sky-950 to-stone-950" },
  { title: "Vivid", artist: "Living Colour", tone: "from-yellow-800 to-neutral-950" },
];

const STEPS = [
  {
    icon: Search,
    title: "Find the tab",
    body: "Search Songsterr for a song or artist and pick the version you want to learn.",
  },
  {
    icon: Disc3,
    title: "Match the album",
    body: "Pin that tab to the real studio album so it sits with the record it belongs to.",
  },
  {
    icon: Library,
    title: "Build your shelf",
    body: "Covers line up like a record shop. Open an album to see which songs you have tracked.",
  },
];

export function Splash({
  clerkEnabled,
  isDemo,
}: {
  clerkEnabled: boolean;
  isDemo: boolean;
}) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,rgba(201,162,74,0.16),transparent_58%)]" />
      <div className="relative mx-auto w-full max-w-5xl px-4 pt-16 pb-10 sm:pt-24">
        <p className="text-[11px] tracking-[0.28em] text-gold uppercase">TabShelf</p>
        <h1 className="font-heading mt-3 max-w-3xl text-4xl leading-tight text-balance sm:text-5xl">
          Your guitar tabs, filed with the records they belong to.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground text-pretty sm:text-lg">
          Search Songsterr, attach each tab to a real album cover, and browse the
          collection on a shelf — not a flat list of links.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <form action={startDemoAction}>
            <Button
              type="submit"
              size="lg"
              className="w-full bg-gold px-5 text-black hover:bg-gold/90 sm:w-auto"
            >
              {isDemo ? "Continue the demo" : "Try the demo"}
            </Button>
          </form>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full border-white/15 px-5 sm:w-auto"
          >
            <Link href="/sign-in">
              {clerkEnabled ? "Sign in to save your shelf" : "Save your shelf"}
            </Link>
          </Button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {isDemo
            ? "You already have a demo shelf in this browser. Sign in to keep it."
            : "The demo lets you search, add albums, and open tabs with no account."}
          {clerkEnabled ? (
            <>
              {" "}
              No account yet?{" "}
              <Link href="/sign-up" className="text-gold underline-offset-4 hover:underline">
                Create one
              </Link>
              .
            </>
          ) : null}
          {" "}
          Need to get in pitch first?{" "}
          <Link href="/tuner" className="text-gold underline-offset-4 hover:underline">
            Open the tuner
          </Link>
          .
        </p>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.title}
              className="rounded-2xl border border-white/8 bg-black/20 p-5"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-gold/15 text-gold">
                <step.icon className="size-4" />
              </span>
              <h2 className="mt-4 text-base">{step.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-16">
          <p className="text-[11px] tracking-[0.28em] text-gold uppercase">
            How it looks
          </p>
          <h2 className="font-heading mt-2 text-2xl">A shelf, not a playlist</h2>
          <div className="shelf mt-6">
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-8 px-2 pt-4 pb-2 sm:justify-start">
              {SAMPLE_RECORDS.map((record) => (
                <div key={record.title} className="w-[148px] shrink-0 sm:w-[168px]">
                  <div
                    className={`album-jacket relative aspect-square overflow-hidden rounded-sm bg-gradient-to-br ${record.tone} p-4 shadow-[6px_10px_24px_rgba(0,0,0,0.45)] ring-1 ring-black/40`}
                  >
                    <p className="text-xs tracking-[0.2em] text-amber-100/70 uppercase">
                      {record.artist}
                    </p>
                    <p className="font-heading mt-8 text-lg text-amber-50">{record.title}</p>
                  </div>
                  <p className="mt-2 truncate text-sm text-zinc-200">{record.artist}</p>
                  <p className="truncate text-xs text-muted-foreground">{record.title}</p>
                </div>
              ))}
            </div>
            <div className="shelf-rail" />
          </div>
        </div>
      </div>
    </div>
  );
}
