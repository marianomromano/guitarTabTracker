import { AppleMusicConnect } from "@/components/apple-music-connect";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <p className="text-[11px] tracking-[0.28em] text-primary uppercase">Settings</p>
      <h1 className="font-heading mt-1 text-3xl">Playback</h1>
      <p className="mt-2 mb-8 text-muted-foreground">
        Connect Apple Music on this device to play full songs. Without it, Play uses a 30-second
        preview.
      </p>
      <div className="rounded-2xl border border-border p-5">
        <h2 className="mb-3 text-lg font-medium">Apple Music</h2>
        <AppleMusicConnect />
      </div>
    </div>
  );
}
