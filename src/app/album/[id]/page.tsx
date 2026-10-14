import Image from "next/image";
import { notFound } from "next/navigation";
import { syncAlbumPreviewsAction } from "@/app/actions";
import { AutoFillTabs } from "@/components/auto-fill-tabs";
import { BackLink } from "@/components/back-link";
import { TrackList } from "@/components/track-list";
import { requireUserId } from "@/lib/auth";
import { hasAnyPart } from "@/lib/instrument";
import { getAlbumWithTracks, getArtistLibrary } from "@/lib/library";

export const dynamic = "force-dynamic";

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUserId();
  await syncAlbumPreviewsAction(id);
  const data = await getAlbumWithTracks(id, userId);

  if (!data) {
    notFound();
  }

  const { album, tracks } = data;
  const savedCount = tracks.filter((track) => hasAnyPart(track.parts)).length;
  const artist = await getArtistLibrary(album.artistId, userId);
  const backHref =
    artist && artist.albums.length > 1 ? `/artist/${artist.id}` : "/library";
  const backLabel =
    artist && artist.albums.length > 1 ? artist.name : "Library";

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-10 lg:grid-cols-[280px_1fr]">
      <div>
        <BackLink href={backHref}>{backLabel}</BackLink>
        <div className="relative aspect-square overflow-hidden rounded-md shadow-2xl ring-1 ring-black/40">
          {album.artworkUrl ? (
            <Image
              src={album.artworkUrl}
              alt={`${album.title} cover`}
              fill
              sizes="280px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted p-6 text-center">
              {album.title}
            </div>
          )}
        </div>
        <h1 className="font-heading mt-4 text-2xl">{album.title}</h1>
        <p className="text-muted-foreground">{album.artistName}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {album.releaseYear ? `${album.releaseYear} · ` : ""}
          {savedCount} of {tracks.length} songs on your shelf
        </p>
      </div>
      <div className="lg:pt-10">
        <TrackList
          tracks={tracks}
          artistName={album.artistName}
          artworkUrl={album.artworkUrl}
          collectionId={album.itunesCollectionId}
          returnTo={`/album/${id}`}
        />
        <AutoFillTabs
          albumId={album.id}
          missing={tracks.filter((track) => !track.parts.guitar).length}
        />
        <p className="mt-4 text-sm text-muted-foreground">
          Tap a song title to open its tab. Tap G, B, or D to add or remove guitar, bass, or drums
          for that song. Upload a Guitar Pro file to replace the blank staff.
        </p>
      </div>
    </div>
  );
}
