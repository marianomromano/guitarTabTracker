import Link from "next/link";
import { Bookshelf } from "@/components/bookshelf";
import { Button } from "@/components/ui/button";
import { requireUserId } from "@/lib/auth";
import { getLibrary } from "@/lib/library";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const userId = await requireUserId();
  const artists = getLibrary(userId);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-[0.28em] text-gold uppercase">Library</p>
          <h1 className="font-heading mt-1 text-3xl">Your shelf</h1>
        </div>
        <Button asChild className="bg-gold text-black hover:bg-gold/90">
          <Link href="/search">Find tabs</Link>
        </Button>
      </div>

      {artists.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center">
          <h2 className="text-xl">The shelf is empty</h2>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            Search for a song, add a tab, and its album cover will land here.
          </p>
          <Button asChild className="mt-6 bg-gold text-black hover:bg-gold/90">
            <Link href="/search">Find your first tab</Link>
          </Button>
        </div>
      ) : (
        <Bookshelf artists={artists} />
      )}
    </div>
  );
}
