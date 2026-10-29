import Image from "next/image";

export function AlbumBackdrop({ artworkUrl }: { artworkUrl: string | null }) {
  if (!artworkUrl) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[48rem] overflow-hidden">
      <Image
        src={artworkUrl}
        alt=""
        fill
        sizes="(max-width: 768px) 100vw, 1200px"
        className="scale-125 object-cover opacity-25 blur-[90px]"
      />
      <div className="absolute inset-0 bg-linear-to-b from-background/20 via-background/50 to-background" />
    </div>
  );
}
