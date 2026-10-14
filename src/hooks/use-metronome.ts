"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { analyzePreviewBpm } from "@/lib/bpm";

const DEFAULT_BPM = 120;
const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.18;

type MetronomeOptions = {
  enabled: boolean;
  playing: boolean;
  previewUrl: string | null;
  trackId: string | null;
  volume: number;
  getPlaybackTime: () => number;
};

export function useMetronome({
  enabled,
  playing,
  previewUrl,
  trackId,
  volume,
  getPlaybackTime,
}: MetronomeOptions) {
  const [bpm, setBpm] = useState<number | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [pulse, setPulse] = useState(false);
  const bpmRef = useRef<number | null>(null);
  const offsetRef = useRef(0);
  const lastBeatRef = useRef(-1);
  const audioRef = useRef<AudioContext | null>(null);
  const pulseTimerRef = useRef(0);
  const manualRef = useRef(false);
  const volumeRef = useRef(volume);

  bpmRef.current = bpm;
  volumeRef.current = volume;

  const audioContext = useCallback(() => {
    if (audioRef.current && audioRef.current.state !== "closed") {
      return audioRef.current;
    }
    const AudioCtx =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    audioRef.current = new AudioCtx();
    return audioRef.current;
  }, []);

  useEffect(() => {
    manualRef.current = false;
    offsetRef.current = 0;
    lastBeatRef.current = -1;
    setBpm(null);
    setDetecting(false);
  }, [trackId]);

  useEffect(() => {
    if (!enabled || manualRef.current) return;
    if (!previewUrl) {
      setBpm((current) => current ?? DEFAULT_BPM);
      setDetecting(false);
      return;
    }
    let cancelled = false;
    setDetecting(true);
    void analyzePreviewBpm(previewUrl)
      .then((guess) => {
        if (cancelled || manualRef.current) return;
        setDetecting(false);
        if (!guess) {
          setBpm((current) => current ?? DEFAULT_BPM);
          return;
        }
        offsetRef.current = guess.offset;
        setBpm(guess.bpm);
      })
      .catch(() => {
        if (cancelled || manualRef.current) return;
        setDetecting(false);
        setBpm((current) => current ?? DEFAULT_BPM);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, previewUrl, trackId]);

  useEffect(() => {
    lastBeatRef.current = -1;
    if (!enabled || !playing || !bpm) {
      return;
    }
    const context = audioContext();
    if (!context) return;
    void context.resume();

    const secondsPerBeat = 60 / bpm;
    const timer = window.setInterval(() => {
      const songTime = getPlaybackTime();
      const now = context.currentTime;
      let beatTime =
        offsetRef.current +
        Math.ceil((songTime - offsetRef.current) / secondsPerBeat - 1e-4) * secondsPerBeat;
      if (beatTime < songTime) beatTime += secondsPerBeat;

      const horizon = songTime + SCHEDULE_AHEAD;
      while (beatTime < horizon) {
        const beat = Math.round((beatTime - offsetRef.current) / secondsPerBeat);
        if (beat > lastBeatRef.current) {
          const when = now + Math.max(0, beatTime - songTime);
          scheduleClick(context, when, beat % 4 === 0, volumeRef.current);
          lastBeatRef.current = beat;
          if (beatTime - songTime < 0.05) {
            setPulse(true);
            window.clearTimeout(pulseTimerRef.current);
            pulseTimerRef.current = window.setTimeout(() => setPulse(false), 80);
          }
        }
        beatTime += secondsPerBeat;
      }
    }, LOOKAHEAD_MS);

    return () => window.clearInterval(timer);
  }, [audioContext, bpm, enabled, getPlaybackTime, playing]);

  useEffect(() => {
    return () => {
      window.clearTimeout(pulseTimerRef.current);
      const context = audioRef.current;
      audioRef.current = null;
      if (context && context.state !== "closed") void context.close();
    };
  }, []);

  const nudge = useCallback((delta: number) => {
    manualRef.current = true;
    setDetecting(false);
    lastBeatRef.current = -1;
    setBpm((current) => clampBpm((current ?? DEFAULT_BPM) + delta));
  }, []);

  return { bpm, detecting, pulse, nudge };
}

function scheduleClick(
  context: AudioContext,
  when: number,
  downbeat: boolean,
  volume: number,
) {
  const level = Math.max(0, Math.min(1, volume));
  if (level <= 0) return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "square";
  oscillator.frequency.value = downbeat ? 1320 : 880;
  gain.gain.setValueAtTime((downbeat ? 0.28 : 0.16) * level, when);
  gain.gain.exponentialRampToValueAtTime(0.001, when + 0.04);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(when);
  oscillator.stop(when + 0.05);
}

function clampBpm(value: number) {
  return Math.min(240, Math.max(40, Math.round(value)));
}
