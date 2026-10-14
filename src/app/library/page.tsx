import Link from "next/link";
import { redirect } from "next/navigation";
import { Bookshelf } from "@/components/bookshelf";
import { ClaimDemoOnMount } from "@/components/claim-demo";
import { DemoBanner } from "@/components/demo-banner";
import { LibraryFilter } from "@/components/library-filter";
import { LibrarySongs } from "@/components/library-songs";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { INSTRUMENT_LABEL, isInstrument } from "@/lib/instrument";
import { getLibrary, getLibrarySongs } from "@/lib/library";

export const dynamic = "force-dynamic";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ part?: string }>;
}) {
  const session = await getSession();
  const params = await searchParams;
  if (!session.userId) {
    redirect("/sign-in");
  }

  const { part } = params;
  const instrument = isInstrument(part) ? part : undefined;
  const artists = instrument ? [] : await getLibrary(session.userId);
  const songs = instrument ? await getLibrarySongs(session.userId, instrument) : [];
  const empty = instrument ? songs.length === 0 : artists.length === 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      {session.isSignedIn ? <ClaimDemoOnMount /> : null}
      {session.isDemo ? <DemoBanner /> : null}
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-[0.28em] text-gold uppercase">
            {session.isDemo ? "Demo shelf" : "Library"}
          </p>
          <h1 className="font-heading mt-1 text-3xl">Your shelf</h1>
          <LibraryFilter current={instrument} />
        </div>
        <Button asChild className="bg-gold text-black hover:bg-gold/90">
          <Link href="/search">Find tabs</Link>
        </Button>
      </div>

      {empty ? (
        <div className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center">
          <h2 className="text-xl">
            {instrument
              ? `No ${INSTRUMENT_LABEL[instrument].toLowerCase()} parts yet`
              : "The shelf is empty"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            Search for a song, pick guitar, bass, or drums, and its album cover will land here.
          </p>
          <Button asChild className="mt-6 bg-gold text-black hover:bg-gold/90">
            <Link href="/search">Find your first tab</Link>
          </Button>
        </div>
      ) : instrument ? (
        <LibrarySongs songs={songs} />
      ) : (
        <Bookshelf artists={artists} />
      )}
    </div>
  );
}
