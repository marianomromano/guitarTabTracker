import Link from "next/link";
import { Button } from "@/components/ui/button";

export function DemoBanner() {
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-gold/25 bg-gold/8 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-pretty">
        You&apos;re trying TabShelf. Sign in to keep this shelf when you come back.
      </p>
      <Button asChild size="sm" className="bg-gold text-black hover:bg-gold/90">
        <Link href="/sign-in">Save your shelf</Link>
      </Button>
    </div>
  );
}
