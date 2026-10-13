"use client";

type TokenResponse = {
  configured: boolean;
  token: string | null;
  storefront?: string;
};

let configured = false;
let configuredPromise: Promise<boolean> | null = null;

function waitForScript() {
  if (window.MusicKit) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error("MusicKit did not load."));
    }, 12000);
    document.addEventListener(
      "musickitloaded",
      () => {
        window.clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

export async function configureMusicKit() {
  if (configured && window.MusicKit) return true;
  if (configuredPromise) return configuredPromise;

  configuredPromise = (async () => {
    const response = await fetch("/api/musickit/token", { cache: "no-store" });
    const data = (await response.json()) as TokenResponse;
    if (!data.configured || !data.token) return false;

    await waitForScript();
    if (!window.MusicKit) return false;

    await window.MusicKit.configure({
      developerToken: data.token,
      app: { name: "TabShelf", build: "0.1.0" },
      storefrontId: data.storefront,
    });
    configured = true;
    return true;
  })().finally(() => {
    configuredPromise = null;
  });

  return configuredPromise;
}

export function getMusicKit() {
  if (!configured || !window.MusicKit) return null;
  return window.MusicKit.getInstance();
}

export async function searchCatalogSong(artist: string, title: string) {
  const music = getMusicKit();
  if (!music) return null;
  const storefront = music.storefrontId || "us";
  const result = await music.api.music(`/v1/catalog/${storefront}/search`, {
    term: `${artist} ${title}`,
    types: "songs",
    limit: "5",
  });
  const songs = result.data?.results?.songs?.data ?? [];
  return songs[0]?.id ?? null;
}
