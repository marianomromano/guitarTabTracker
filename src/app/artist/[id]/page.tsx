import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AlbumCover } from "@/components/album-cover";
import { requireUserId } from "@/lib/auth";
import { getArtistLibrary } from "@/lib/library";

export const dynamic = "force-dynamic";

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUserId();
  const artist = getArtistLibrary(id, userId);

  if (!artist) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Library
      </Link>
      <p className="text-[11px] tracking-[0.28em] text-gold uppercase">Artist</p>
      <h1 className="font-heading mt-1 mb-8 text-3xl">{artist.name}</h1>
      <div className="shelf">
        <div className="flex flex-wrap gap-x-5 gap-y-8 px-2 pt-4 pb-2">
          {artist.albums.map((album) => (
            <AlbumCover key={album.id} album={album} />
          ))}
        </div>
        <div className="shelf-rail" />
      </div>
    </div>
  );
}
