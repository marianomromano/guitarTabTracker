"use client";

type TokenResponse = {
  configured: boolean;
  token: string | null;
  storefront?: string;
};

let configured = false;
let configuredPromise: Promise<boolean> | null = null;

const USER_TOKEN_KEY = "tabshelf.apple-music-user-token";

export function readSavedMusicUserToken() {
  try {
    return window.localStorage.getItem(USER_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function rememberMusicUserToken(token: string | null | undefined) {
  try {
    if (!token) {
      window.localStorage.removeItem(USER_TOKEN_KEY);
      return;
    }
    window.localStorage.setItem(USER_TOKEN_KEY, token);
  } catch {
    // Private mode or storage blocked — MusicKit may still keep a session cookie.
  }
}

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
    const response = await fetch("/api/musickit/token", {
      cache: "no-store",
      headers: { "x-music-origin": window.location.origin },
    });
    const data = (await response.json()) as TokenResponse;
    if (!data.configured || !data.token) return false;

    await waitForScript();
    if (!window.MusicKit) return false;

    const savedUserToken = readSavedMusicUserToken() ?? undefined;
    await window.MusicKit.configure({
      developerToken: data.token,
      app: { name: "TabShelf", build: "0.1.0" },
      storefrontId: data.storefront,
      musicUserToken: savedUserToken,
    });
    const music = window.MusicKit.getInstance();
    if (savedUserToken && !music.isAuthorized) {
      music.musicUserToken = savedUserToken;
    }
    if (music.isAuthorized && music.musicUserToken) {
      rememberMusicUserToken(music.musicUserToken);
    }
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

export function persistMusicAuthorization() {
  const music = getMusicKit();
  if (music?.isAuthorized) {
    rememberMusicUserToken(music.musicUserToken);
    return;
  }
  rememberMusicUserToken(null);
}

export function authorizeErrorMessage(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  const host = typeof window !== "undefined" ? window.location.hostname : "this site";
  if (/error_request_failed|REQUEST_FAILED|authorization|cancelled|canceled|popup/i.test(raw) || !raw) {
    return `Apple rejected Music sign-in from ${host}. In Certificates, Identifiers & Profiles, open your MusicKit identifier and add ${host} under Website URLs, then allow popups and try again.`;
  }
  return raw;
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
