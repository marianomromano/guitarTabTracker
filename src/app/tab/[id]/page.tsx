import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppleMusicConnect } from "@/components/apple-music-connect";
import { ChangeTabButton } from "@/components/change-tab-button";
import { PlayButton } from "@/components/play-button";
import { TabStage } from "@/components/tab-stage";
import { resolveTrackMediaAction } from "@/app/actions";
import { requireUserId } from "@/lib/auth";
import { placeholderAlphaTex } from "@/lib/alphatex";
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
      <Link
        href={
          tab.itunesCollectionId ? `/album/itunes-${tab.itunesCollectionId}` : `/album/${tab.albumId}`
        }
        className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {tab.albumTitle}
      </Link>
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
          <h1 className="font-heading text-2xl sm:text-3xl">{tab.trackTitle}</h1>
          <p className="text-sm text-muted-foreground">
            {tab.artistName} · {tab.albumTitle}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
          />
        </div>
      </div>
      <div className="mb-4">
        <AppleMusicConnect />
      </div>
      <TabStage
        trackId={tab.trackId}
        title={tab.trackTitle}
        artist={tab.artistName}
        tabTex={tab.tabTex ?? placeholderAlphaTex(tab.trackTitle, tab.artistName)}
        tabFile={tab.tabFile}
        tabFilename={tab.tabFilename}
        soundsliceHash={tab.soundsliceHash}
      />
    </div>
  );
}
