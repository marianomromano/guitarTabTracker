import { SearchForm } from "@/components/search-form";
import { SearchResults } from "@/components/search-results";
import { addErrorMessage } from "@/lib/add-errors";
import { searchItunesSongs } from "@/lib/itunes";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; addError?: string }>;
}) {
  const { q, addError } = await searchParams;
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
        Add a specific song as guitar, bass, or drums. TabShelf opens that part with an alphaTab
        staff you can play and replace.
      </p>
      <SearchForm key={query} initialQuery={query} />
      {addErrorMessage(addError) ? (
        <p className="mb-4 text-base text-destructive">{addErrorMessage(addError)}</p>
      ) : null}
      {searchError ? (
        <p className="text-destructive">{searchError}</p>
      ) : (
        <SearchResults query={query} results={results} />
      )}
    </div>
  );
}
