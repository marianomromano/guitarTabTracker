import type { LibraryArtist } from "@/lib/library";
import { AlbumCover } from "@/components/album-cover";

function artistHref(artist: LibraryArtist) {
  if (artist.albums.length > 1) return `/artist/${artist.id}`;
  const collectionId = artist.coverAlbum.itunesCollectionId;
  return collectionId ? `/album/itunes-${collectionId}` : `/album/${artist.coverAlbum.id}`;
}

function artistSubtitle(artist: LibraryArtist) {
  const albumCount = artist.albums.length;
  const tabCount = artist.albums.reduce((sum, album) => sum + album.tabCount, 0);
  if (albumCount === 1) {
    return `${artist.coverAlbum.title} · ${tabCount} ${tabCount === 1 ? "tab" : "tabs"}`;
  }
  return `${albumCount} albums · ${tabCount} ${tabCount === 1 ? "tab" : "tabs"}`;
}

export function Bookshelf({ artists }: { artists: LibraryArtist[] }) {
  return (
    <div className="shelf">
      <div className="flex flex-wrap gap-x-5 gap-y-8 px-2 pt-4 pb-2">
        {artists.map((artist) => (
          <AlbumCover
            key={artist.id}
            album={artist.coverAlbum}
            href={artistHref(artist)}
            label={artist.name}
            subtitle={artistSubtitle(artist)}
          />
        ))}
      </div>
      <div className="shelf-rail" />
    </div>
  );
}
