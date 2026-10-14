import Link from "next/link";
import { INSTRUMENT_LABEL, INSTRUMENTS, type Instrument } from "@/lib/instrument";
import { cn } from "@/lib/utils";

export function LibraryFilter({ current }: { current?: Instrument }) {
  const items = [
    { href: "/library", label: "All", active: !current },
    ...INSTRUMENTS.map((instrument) => ({
      href: `/library?part=${instrument}`,
      label: INSTRUMENT_LABEL[instrument],
      active: current === instrument,
    })),
  ];

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "inline-flex min-h-12 items-center rounded-full px-4 text-base",
            item.active
              ? "bg-gold text-black"
              : "text-muted-foreground ring-1 ring-white/15 hover:text-foreground",
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
