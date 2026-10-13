import Link from "next/link";
import { redirect } from "next/navigation";
import { Bookshelf } from "@/components/bookshelf";
import { ClaimDemoOnMount } from "@/components/claim-demo";
import { DemoBanner } from "@/components/demo-banner";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { getLibrary } from "@/lib/library";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const session = await getSession();
  if (!session.userId) {
    redirect("/");
  }

  const artists = getLibrary(session.userId);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      {session.isSignedIn ? <ClaimDemoOnMount /> : null}
      {session.isDemo ? <DemoBanner clerkEnabled={session.clerkEnabled} /> : null}
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-[0.28em] text-gold uppercase">
            {session.isDemo ? "Demo shelf" : "Library"}
          </p>
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
