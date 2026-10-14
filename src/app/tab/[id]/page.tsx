import Image from "next/image";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { ChangeTabButton } from "@/components/change-tab-button";
import { PartButtons } from "@/components/part-buttons";
import { PlayButton } from "@/components/play-button";
import { TabStage } from "@/components/tab-stage";
import { resolveTrackMediaAction } from "@/app/actions";
import { requireUserId } from "@/lib/auth";
import { placeholderAlphaTex } from "@/lib/alphatex";
import { INSTRUMENT_LABEL } from "@/lib/instrument";
import { getTabForUser } from "@/lib/library";

export const dynamic = "force-dynamic";

export default async function TabPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUserId();
  const tab = await getTabForUser(id, userId);

  if (!tab) {
    notFound();
  }

  const media = await resolveTrackMediaAction(tab.trackId);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6">
      <BackLink
        href={
          tab.itunesCollectionId ? `/album/itunes-${tab.itunesCollectionId}` : `/album/${tab.albumId}`
        }
      >
        {tab.albumTitle}
      </BackLink>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        {tab.artworkUrl ? (
          <Image
            src={tab.artworkUrl}
            alt={`${tab.albumTitle} cover`}
            width={72}
            height={72}
            className="size-16 rounded-md object-cover shadow-2xl ring-1 ring-black/40"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] tracking-[0.28em] text-gold uppercase">
            {INSTRUMENT_LABEL[tab.instrument]}
          </p>
          <h1 className="font-heading text-2xl sm:text-3xl">{tab.trackTitle}</h1>
          <p className="text-sm text-muted-foreground">
            {tab.artistName} · {tab.albumTitle}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PartButtons
            trackId={tab.trackId}
            parts={tab.parts}
            active={tab.instrument}
            returnTo={`/tab/${id}`}
          />
          <PlayButton
            size="lg"
            track={{
              id: tab.trackId,
              title: tab.trackTitle,
              artist: tab.artistName,
              artworkUrl: tab.artworkUrl,
              previewUrl: media?.previewUrl ?? tab.previewUrl,
              appleMusicId: media?.appleMusicId ?? tab.appleMusicId,
            }}
          />
          <ChangeTabButton
            trackId={tab.trackId}
            trackTitle={tab.trackTitle}
            artistName={tab.artistName}
            instrument={tab.instrument}
          />
        </div>
      </div>
      <TabStage
        trackId={tab.trackId}
        title={tab.trackTitle}
        artist={tab.artistName}
        instrument={tab.instrument}
        tabTex={tab.tabTex ?? placeholderAlphaTex(tab.trackTitle, tab.artistName, tab.instrument)}
        tabFile={tab.tabFile}
        tabFilename={tab.tabFilename}
        soundsliceHash={tab.soundsliceHash}
      />
    </div>
  );
}
