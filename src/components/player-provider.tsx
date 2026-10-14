"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  authorizeErrorMessage,
  configureMusicKit,
  getMusicKit,
  persistMusicAuthorization,
  rememberMusicUserToken,
  searchCatalogSong,
} from "@/lib/musickit";

export type PlayableTrack = {
  id: string;
  title: string;
  artist: string;
  artworkUrl: string | null;
  previewUrl: string | null;
  appleMusicId: string | null;
};

export type PlaybackSource = "apple" | "preview" | null;

type PlayerContextValue = {
  track: PlayableTrack | null;
  playing: boolean;
  progress: number;
  duration: number;
  source: PlaybackSource;
  musicConfigured: boolean;
  musicAuthorized: boolean;
  play: (track: PlayableTrack) => Promise<void>;
  toggle: () => void;
  seek: (time: number) => void;
  stop: () => void;
  getPlaybackTime: () => number;
  authorizeAppleMusic: () => Promise<boolean>;
  disconnectAppleMusic: () => Promise<void>;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const listenersBound = useRef(false);
  const [track, setTrack] = useState<PlayableTrack | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [source, setSource] = useState<PlaybackSource>(null);
  const [musicConfigured, setMusicConfigured] = useState(false);
  const [musicAuthorized, setMusicAuthorized] = useState(false);
  const sourceRef = useRef<PlaybackSource>(null);
  sourceRef.current = source;

  const bindMusicEvents = useCallback((music: NonNullable<ReturnType<typeof getMusicKit>>) => {
    if (listenersBound.current || !window.MusicKit) return;
    listenersBound.current = true;
    const { Events, PlaybackStates } = window.MusicKit;
    const playingStates = new Set([PlaybackStates.playing, PlaybackStates.seeking, PlaybackStates.waiting]);

    music.addEventListener(Events.authorizationStatusDidChange, () => {
      if (music.isAuthorized) persistMusicAuthorization();
      else rememberMusicUserToken(null);
      setMusicAuthorized(Boolean(music.isAuthorized));
    });
    music.addEventListener(Events.playbackStateDidChange, () => {
      setPlaying(playingStates.has(music.playbackState));
      if (music.playbackState === PlaybackStates.ended || music.playbackState === PlaybackStates.completed) {
        setPlaying(false);
        setProgress(0);
      }
    });
    music.addEventListener(Events.playbackTimeDidChange, () => {
      setProgress(music.currentPlaybackTime || 0);
      setDuration(music.currentPlaybackDuration || 0);
    });
    music.addEventListener(Events.playbackDurationDidChange, () => {
      setDuration(music.currentPlaybackDuration || 0);
    });
  }, []);

  useEffect(() => {
    void configureMusicKit().then((ok) => {
      setMusicConfigured(ok);
      const music = getMusicKit();
      if (music) {
        setMusicAuthorized(Boolean(music.isAuthorized));
        bindMusicEvents(music);
      }
    });
  }, [bindMusicEvents]);

  useEffect(() => {
    if (source !== "apple" || !playing) return;
    const timer = window.setInterval(() => {
      const music = getMusicKit();
      if (!music) return;
      setProgress(music.currentPlaybackTime || 0);
      setDuration(music.currentPlaybackDuration || 0);
    }, 250);
    return () => window.clearInterval(timer);
  }, [playing, source]);

  const playPreview = useCallback((next: PlayableTrack) => {
    const audio = audioRef.current;
    if (!audio || !next.previewUrl) return false;
    getMusicKit()?.pause();
    setSource("preview");
    setProgress(0);
    const preview = next.previewUrl.startsWith("/api/preview")
      ? next.previewUrl
      : `/api/preview?url=${encodeURIComponent(next.previewUrl)}`;
    audio.src = preview;
    void audio.play().catch((error) => {
      console.error(error);
    });
    return true;
  }, []);

  const authorizeAppleMusic = useCallback(async () => {
    let music = getMusicKit();
    if (!music) {
      const ready = await configureMusicKit();
      setMusicConfigured(ready);
      if (!ready) return false;
      music = getMusicKit();
    }
    if (!music) return false;
    bindMusicEvents(music);
    if (!music.isAuthorized) {
      try {
        const token = await music.authorize();
        rememberMusicUserToken(token || music.musicUserToken);
      } catch (error) {
        throw new Error(authorizeErrorMessage(error));
      }
    }
    persistMusicAuthorization();
    setMusicAuthorized(Boolean(music.isAuthorized));
    return Boolean(music.isAuthorized);
  }, [bindMusicEvents]);

  const disconnectAppleMusic = useCallback(async () => {
    const music = getMusicKit();
    rememberMusicUserToken(null);
    if (music?.isAuthorized) {
      await music.unauthorize();
    }
    setMusicAuthorized(false);
  }, []);

  const play = useCallback(
    async (next: PlayableTrack) => {
      setTrack(next);
      setProgress(0);
      // Start the preview in the same tap so iPad autoplay is not blocked.
      // Full Apple Music songs only play when already connected — Play must
      // not open Apple's login popup.
      const startedPreview = playPreview(next);

      try {
        const ready = await configureMusicKit();
        setMusicConfigured(ready);
        const music = getMusicKit();
        if (!ready || !music?.isAuthorized) return;
        bindMusicEvents(music);

        let songId = next.appleMusicId;
        if (!songId) {
          songId = await searchCatalogSong(next.artist, next.title);
        }
        if (!songId) return;

        audioRef.current?.pause();
        await music.setQueue({ song: songId });
        await music.play();
        setSource("apple");
        setPlaying(true);
      } catch (error) {
        console.error(error);
        if (!startedPreview) playPreview(next);
      }
    },
    [bindMusicEvents, playPreview],
  );

  const toggle = useCallback(() => {
    if (!track) return;
    if (source === "apple") {
      const music = getMusicKit();
      if (!music) return;
      if (playing) music.pause();
      else void music.play();
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play();
    else audio.pause();
  }, [playing, source, track]);

  const seek = useCallback(
    (time: number) => {
      if (source === "apple") {
        void getMusicKit()?.seekToTime(time);
        setProgress(time);
        return;
      }
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = time;
      setProgress(time);
    },
    [source],
  );

  const getPlaybackTime = useCallback(() => {
    if (sourceRef.current === "apple") {
      return getMusicKit()?.currentPlaybackTime || 0;
    }
    return audioRef.current?.currentTime || 0;
  }, []);

  const stop = useCallback(() => {
    getMusicKit()?.stop();
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
    }
    setPlaying(false);
    setTrack(null);
    setSource(null);
    setProgress(0);
    setDuration(0);
  }, []);

  const value = useMemo<PlayerContextValue>(
    () => ({
      track,
      playing,
      progress,
      duration,
      source,
      musicConfigured,
      musicAuthorized,
      play,
      toggle,
      seek,
      stop,
      getPlaybackTime,
      authorizeAppleMusic,
      disconnectAppleMusic,
    }),
    [
      authorizeAppleMusic,
      disconnectAppleMusic,
      duration,
      getPlaybackTime,
      musicAuthorized,
      musicConfigured,
      play,
      playing,
      progress,
      seek,
      source,
      stop,
      toggle,
      track,
    ],
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="none"
        playsInline
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
        }}
        onTimeUpdate={(event) => setProgress(event.currentTarget.currentTime)}
        onDurationChange={(event) => setDuration(event.currentTarget.duration || 0)}
      />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within PlayerProvider");
  }
  return context;
}
