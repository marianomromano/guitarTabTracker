import { SearchForm } from "@/components/search-form";
import { SearchResults } from "@/components/search-results";
import { requireUserId } from "@/lib/auth";
import { searchItunesSongs } from "@/lib/itunes";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireUserId();
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  let results: Awaited<ReturnType<typeof searchItunesSongs>> = [];
  let searchError: string | null = null;
  if (query) {
    try {
      results = await searchItunesSongs(query);
    } catch {
      searchError = "Could not search songs right now. Try again in a moment.";
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <p className="text-[11px] tracking-[0.28em] text-gold uppercase">Find tabs</p>
      <h1 className="font-heading mt-1 text-3xl">Search songs</h1>
      <p className="mt-2 mb-6 text-muted-foreground">
        Add an album to your shelf. TabShelf opens that song with an alphaTab staff you can play and replace.
      </p>
      <SearchForm key={query} initialQuery={query} />
      {searchError ? (
        <p className="text-destructive">{searchError}</p>
      ) : (
        <SearchResults query={query} results={results} />
      )}
    </div>
  );
}
