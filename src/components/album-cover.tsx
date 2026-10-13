import Image from "next/image";
import Link from "next/link";
import type { LibraryAlbum } from "@/lib/library";

export function AlbumCover({
  album,
  href,
  label,
  subtitle,
}: {
  album: Pick<
    LibraryAlbum,
    "id" | "title" | "artworkUrl" | "tabCount" | "releaseYear" | "itunesCollectionId"
  >;
  href?: string;
  label?: string;
  subtitle?: string;
}) {
  const title = label ?? album.title;
  const meta =
    subtitle ??
    `${album.tabCount} ${album.tabCount === 1 ? "tab" : "tabs"}${
      album.releaseYear ? ` · ${album.releaseYear}` : ""
    }`;

  return (
    <Link
      href={
        href ??
        (album.itunesCollectionId ? `/album/itunes-${album.itunesCollectionId}` : `/album/${album.id}`)
      }
      className="group w-[148px] shrink-0 active:opacity-80 sm:w-[168px]"
    >
      <div className="album-jacket relative aspect-square overflow-hidden rounded-sm bg-[#1a140f] shadow-[6px_10px_24px_rgba(0,0,0,0.45)] ring-1 ring-black/40 transition duration-200 group-hover:-translate-y-2 group-hover:shadow-[8px_18px_32px_rgba(0,0,0,0.55)]">
        {album.artworkUrl ? (
          <Image
            src={album.artworkUrl}
            alt={`${title} cover`}
            fill
            sizes="168px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-amber-900 to-stone-950 p-3 text-center text-xs text-amber-100/80">
            {title}
          </div>
        )}
      </div>
      <p className="mt-2 truncate text-sm text-zinc-200">{title}</p>
      <p className="truncate text-xs text-muted-foreground">{meta}</p>
    </Link>
  );
}
