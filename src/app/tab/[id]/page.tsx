import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChangeTabButton } from "@/components/change-tab-button";
import { TabFrame } from "@/components/tab-frame";
import { requireUserId } from "@/lib/auth";
import { getTabForUser } from "@/lib/library";

export const dynamic = "force-dynamic";

export default async function TabPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUserId();
  const tab = getTabForUser(id, userId);

  if (!tab) {
    notFound();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="z-20 shrink-0 border-b border-white/5 bg-[#12100c]">
        <div className="flex items-center gap-3 px-3 py-2 sm:px-4">
          <Link
            href={`/album/${tab.albumId}`}
            className="inline-flex shrink-0 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">{tab.albumTitle}</span>
            <span className="sm:hidden">Album</span>
          </Link>
          <Link
            href="/"
            className="hidden shrink-0 items-center gap-1 text-sm text-muted-foreground hover:text-foreground sm:inline-flex"
          >
            <Library className="size-3.5" />
            Library
          </Link>
          {tab.artworkUrl ? (
            <Image
              src={tab.artworkUrl}
              alt=""
              width={40}
              height={40}
              className="size-10 shrink-0 rounded-sm object-cover ring-1 ring-black/40"
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-heading text-base sm:text-lg">
              {tab.trackTitle}
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              {tab.artistName} · {tab.albumTitle}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ChangeTabButton
              size="sm"
              trackId={tab.trackId}
              trackTitle={tab.trackTitle}
              artistName={tab.artistName}
              currentSongsterrId={tab.songsterrId}
            />
            <Button asChild size="sm" className="bg-gold text-black hover:bg-gold/90">
              <a href={tab.songsterrUrl} target="_blank" rel="noreferrer">
                Open on Songsterr
                <ExternalLink />
              </a>
            </Button>
          </div>
        </div>
      </header>
      <TabFrame src={tab.songsterrUrl} title={`${tab.trackTitle} tab`} />
    </div>
  );
}
