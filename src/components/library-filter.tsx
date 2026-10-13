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
            "rounded-full px-3 py-1.5 text-sm",
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
