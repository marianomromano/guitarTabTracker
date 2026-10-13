"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  closestString,
  detectPitch,
  noteFromFrequency,
  rmsLevel,
  type InstrumentPreset,
  type TunerString,
} from "@/lib/tuner";

export type TunerStatus = "idle" | "listening" | "denied" | "error";

export type TunerReading = {
  frequency: number;
  note: string;
  cents: number;
  string: TunerString;
  inTune: boolean;
};

type AudioGraph = {
  context: AudioContext;
  stream: MediaStream;
  source: MediaStreamAudioSourceNode;
  input: GainNode;
  analyser: AnalyserNode;
  mute: GainNode;
  floatBuffer: Float32Array<ArrayBuffer>;
  byteBuffer: Uint8Array<ArrayBuffer>;
  onStateChange: () => void;
};

function audioContextClass() {
  if (typeof window === "undefined") return undefined;
  return (
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  );
}

export function useTuner(instrument: InstrumentPreset, lockedString: TunerString | null) {
  const [status, setStatus] = useState<TunerStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState<TunerReading | null>(null);
  const [level, setLevel] = useState(0);
  const graphRef = useRef<AudioGraph | null>(null);
  const rafRef = useRef(0);
  const timerRef = useRef(0);
  const lastUiRef = useRef(0);
  const lastPitchAtRef = useRef(0);
  const smoothedRef = useRef<number | null>(null);
  const instrumentRef = useRef(instrument);
  const lockedRef = useRef(lockedString);

  instrumentRef.current = instrument;
  lockedRef.current = lockedString;

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    window.clearInterval(timerRef.current);
    const graph = graphRef.current;
    graphRef.current = null;
    exposeTunerDebug(null);
    smoothedRef.current = null;
    lastPitchAtRef.current = 0;
    setReading(null);
    setLevel(0);
    if (!graph) {
      setStatus("idle");
      return;
    }
    graph.context.removeEventListener("statechange", graph.onStateChange);
    graph.source.disconnect();
    graph.input.disconnect();
    graph.analyser.disconnect();
    graph.mute.disconnect();
    for (const track of graph.stream.getTracks()) track.stop();
    void graph.context.close();
    setStatus("idle");
  }, []);

  const pump = useCallback(() => {
    const graph = graphRef.current;
    if (!graph) return;

    if (graph.context.state === "suspended") {
      void graph.context.resume();
    }

    try {
      const rms = readWaveform(graph);
      const preset = instrumentRef.current;
      const raw = detectPitch(
        graph.floatBuffer,
        graph.context.sampleRate,
        preset.minHz,
        preset.maxHz,
        rms,
      );

      const now = performance.now();
      if (now - lastUiRef.current < 50) return;
      lastUiRef.current = now;
      setLevel(rms);
      if (raw) {
        lastPitchAtRef.current = now;
        const previous = smoothedRef.current;
        const frequency =
          previous && Math.abs(centsBetween(previous, raw)) < 80
            ? previous * 0.62 + raw * 0.38
            : raw;
        smoothedRef.current = frequency;
        const target = lockedRef.current ?? closestString(frequency, preset.strings).string;
        const cents = 1200 * Math.log2(frequency / target.frequency);
        const note = noteFromFrequency(frequency);
        setReading({
          frequency,
          note: note.label,
          cents,
          string: target,
          inTune: Math.abs(cents) <= 5,
        });
      } else if (now - lastPitchAtRef.current > 400) {
        smoothedRef.current = null;
        setReading(null);
      }
    } catch {
      // Keep the loop alive if one audio frame fails.
    }
  }, []);

  const start = useCallback(async () => {
    const ContextClass = audioContextClass();
    if (!navigator.mediaDevices?.getUserMedia || !ContextClass) {
      setStatus("error");
      setError("This browser cannot use the microphone.");
      return;
    }

    stop();
    setError(null);

    // Resume during the tap so Safari/Chrome keep the user gesture.
    const context = new ContextClass({ latencyHint: "interactive" });
    const resumePromise = context.resume();

    let stream: MediaStream | null = null;
    try {
      stream = await openMicrophone();
      await resumePromise;
      if (context.state === "suspended") {
        await context.resume();
      }

      for (const track of stream.getAudioTracks()) {
        track.enabled = true;
      }

      const source = context.createMediaStreamSource(stream);
      const input = context.createGain();
      input.gain.value = 1;
      const analyser = context.createAnalyser();
      analyser.fftSize = 8192;
      analyser.smoothingTimeConstant = 0;
      const mute = context.createGain();
      mute.gain.value = 0;
      source.connect(input);
      input.connect(analyser);
      // Some browsers skip analyser work unless the graph reaches destination.
      analyser.connect(mute);
      mute.connect(context.destination);

      const onStateChange = () => {
        if (context.state === "suspended") void context.resume();
      };
      context.addEventListener("statechange", onStateChange);

      const size = analyser.fftSize;
      graphRef.current = {
        context,
        stream,
        source,
        input,
        analyser,
        mute,
        floatBuffer: new Float32Array(new ArrayBuffer(size * 4)),
        byteBuffer: new Uint8Array(new ArrayBuffer(size)),
        onStateChange,
      };
      setStatus("listening");
      exposeTunerDebug(graphRef.current);
      const loop = () => {
        pump();
        if (graphRef.current) rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
      timerRef.current = window.setInterval(pump, 50);
    } catch (caught) {
      if (stream) {
        for (const track of stream.getTracks()) track.stop();
      }
      void context.close();
      const denied =
        caught instanceof DOMException &&
        (caught.name === "NotAllowedError" || caught.name === "PermissionDeniedError");
      setStatus(denied ? "denied" : "error");
      setError(
        denied
          ? "Microphone access is blocked. Allow it in the browser to tune."
          : "Could not start the tuner. Check the microphone and try again.",
      );
    }
  }, [stop, pump]);

  useEffect(() => stop, [stop]);

  useEffect(() => {
    function resumeIfNeeded() {
      const graph = graphRef.current;
      if (graph && graph.context.state === "suspended") {
        void graph.context.resume();
      }
    }
    document.addEventListener("visibilitychange", resumeIfNeeded);
    window.addEventListener("focus", resumeIfNeeded);
    return () => {
      document.removeEventListener("visibilitychange", resumeIfNeeded);
      window.removeEventListener("focus", resumeIfNeeded);
    };
  }, []);

  return { status, error, reading, level, start, stop };
}

function centsBetween(a: number, b: number) {
  return 1200 * Math.log2(a / b);
}

function readWaveform(graph: AudioGraph) {
  // getFloatTimeDomainData stays silent in some Chromium/WebKit builds
  // even when the mic is live; the byte reader still has the waveform.
  graph.analyser.getByteTimeDomainData(graph.byteBuffer);
  for (let i = 0; i < graph.byteBuffer.length; i += 1) {
    graph.floatBuffer[i] = (graph.byteBuffer[i] - 128) / 128;
  }
  return rmsLevel(graph.floatBuffer);
}

async function openMicrophone() {
  const preferred = {
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      // AGC off made laptop/phone mics too quiet to clear the pitch gate.
      autoGainControl: true,
      channelCount: 1,
      voiceIsolation: false,
    },
    video: false,
  } as MediaStreamConstraints;

  try {
    return await navigator.mediaDevices.getUserMedia(preferred);
  } catch {
    return navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  }
}

function exposeTunerDebug(graph: AudioGraph | null) {
  if (process.env.NODE_ENV === "production") return;
  const debugWindow = window as Window & {
    __tabshelfTuner?: {
      state: () => AudioContextState | "none";
      sample: () => number;
      inject: (hz: number) => void;
    };
  };
  if (!graph) {
    delete debugWindow.__tabshelfTuner;
    return;
  }
  const oscillators: OscillatorNode[] = [];
  debugWindow.__tabshelfTuner = {
    state: () => graph.context.state,
    sample: () => readWaveform(graph),
    inject(hz: number) {
      const osc = graph.context.createOscillator();
      const gain = graph.context.createGain();
      gain.gain.value = 0.2;
      osc.frequency.value = hz;
      osc.connect(gain);
      gain.connect(graph.input);
      osc.start();
      oscillators.push(osc);
    },
  };
}
