import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchForm({ initialQuery = "" }: { initialQuery?: string }) {
  return (
    <form action="/search" method="get" className="mb-8 flex gap-2">
      <label className="flex min-h-12 flex-1 items-center gap-2 rounded-lg border border-input bg-black/20 px-3">
        <Search className="size-5 shrink-0 text-muted-foreground" />
        <Input
          type="search"
          name="q"
          defaultValue={initialQuery}
          placeholder="Song or artist"
          className="h-full border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent"
          enterKeyHint="search"
        />
      </label>
      <Button type="submit" className="bg-gold text-black hover:bg-gold/90">
        Search
      </Button>
    </form>
  );
}
