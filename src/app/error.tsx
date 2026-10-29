"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-lg flex-col items-center justify-center px-4 text-center">
      <p className="text-[11px] tracking-[0.28em] text-primary uppercase">Something went wrong</p>
      <h1 className="font-heading mt-2 text-2xl">This page couldn&apos;t load</h1>
      <p className="mt-2 text-muted-foreground">
        The library couldn&apos;t be saved or read. Try again, or go back to search.
      </p>
      <div className="mt-6 flex gap-2">
        <Button onClick={reset} className="bg-gold text-black hover:bg-gold/90">
          Try again
        </Button>
        <Button asChild variant="outline">
          <a href="/search">Back to search</a>
        </Button>
      </div>
    </div>
  );
}
