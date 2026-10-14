export {};

declare global {
  interface Window {
    MusicKit?: MusicKitApi;
  }
}

type MusicKitApi = {
  configure: (options: {
    developerToken: string;
    app: { name: string; build: string };
    storefrontId?: string;
    musicUserToken?: string;
  }) => Promise<MusicKitInstance>;
  getInstance: () => MusicKitInstance;
  Events: {
    authorizationStatusDidChange: string;
    playbackStateDidChange: string;
    playbackTimeDidChange: string;
    playbackDurationDidChange: string;
    mediaItemDidChange: string;
  };
  PlaybackStates: {
    none: number;
    loading: number;
    playing: number;
    paused: number;
    stopped: number;
    ended: number;
    seeking: number;
    waiting: number;
    stalled: number;
    completed: number;
  };
};

type MusicKitInstance = {
  isAuthorized: boolean;
  musicUserToken?: string;
  storefrontId?: string;
  currentPlaybackTime: number;
  currentPlaybackDuration: number;
  playbackState: number;
  authorize: () => Promise<string>;
  unauthorize: () => Promise<void>;
  setQueue: (queue: { song?: string; songs?: string[] }) => Promise<unknown>;
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  seekToTime: (seconds: number) => Promise<void>;
  addEventListener: (event: string, handler: (...args: unknown[]) => void) => void;
  removeEventListener: (event: string, handler: (...args: unknown[]) => void) => void;
  api: {
    music: (
      path: string,
      params?: Record<string, string>,
    ) => Promise<{
      data?: {
        results?: {
          songs?: {
            data?: { id: string; attributes?: { name?: string; artistName?: string } }[];
          };
        };
      };
    }>;
  };
};
