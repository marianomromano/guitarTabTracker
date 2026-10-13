"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchForm({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = query.trim();
    router.push(next ? `/search?q=${encodeURIComponent(next)}` : "/search");
  }

  return (
    <form onSubmit={onSubmit} className="mb-8 flex gap-2">
      <label className="flex min-h-11 flex-1 items-center gap-2 rounded-lg border border-input bg-black/20 px-3 md:min-h-8 md:px-2.5">
        <Search className="size-4 shrink-0 text-muted-foreground md:size-3.5" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
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
