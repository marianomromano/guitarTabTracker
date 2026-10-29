import { CORE_KIT_MANUAL, getCoreKitRecommendation } from "@/lib/strata-core-kits";

export function StrataCoreKitHint({ artistName, albumTitle, compact = false, showFallback = false }: {
  artistName: string;
  albumTitle?: string | null;
  compact?: boolean;
  showFallback?: boolean;
}) {
  const recommendation = getCoreKitRecommendation(artistName, albumTitle);
  if (recommendation.match === "fallback" && !showFallback) return null;
  return (
    <aside aria-label="Alesis Strata Core kit recommendation" className={compact ? "mt-2 min-w-0 rounded-xl bg-gold/5 p-3 ring-1 ring-gold/20" : "mt-3 min-w-0 rounded-xl bg-gold/5 p-4 ring-1 ring-gold/20"}>
      <p className="text-[11px] tracking-[0.18em] text-primary uppercase">Alesis Strata Core · Suggested kit</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {recommendation.match === "album" ? "Album" : recommendation.match === "artist" ? "Artist" : "General"} match · {recommendation.label}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {recommendation.presets.map((preset, index) => (
          <span key={preset.number} className="inline-flex min-h-10 flex-wrap items-center gap-2 rounded-lg bg-gold/15 px-3 py-2 text-sm text-foreground">
            <span className="font-mono text-primary">#{String(preset.number).padStart(2, "0")}</span>
            <span>{preset.name}</span>
            {index > 0 ? <span className="text-xs text-muted-foreground">Alternate</span> : null}
          </span>
        ))}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{recommendation.reason}</p>
      <p className="mt-2 text-xs text-muted-foreground">Suggested sound, not an official artist preset. <a href={CORE_KIT_MANUAL} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">Core factory kit list</a></p>
    </aside>
  );
}
