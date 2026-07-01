"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface StemSpec {
  id: string;
  label: string;
  url: string;
}

export interface TrackState {
  id: string;
  label: string;
  volume: number; // 0..1 user-set
  muted: boolean;
  soloed: boolean;
  failed: boolean;
}

interface TrackNodes {
  buffer: AudioBuffer;
  gain: GainNode;
  source: AudioBufferSourceNode | null;
}

const RAMP = 0.015; // 15ms gain ramp — avoids clicks
const START_LEAD = 0.06; // schedule slightly ahead so all sources start together

type Status = "idle" | "loading" | "ready" | "error";

/**
 * Sample-accurate synced multitrack playback. One AudioContext / master clock;
 * each stem is a decoded AudioBuffer + GainNode. Play/pause/seek recreate the
 * one-shot source nodes and schedule them at a shared timestamp.
 */
export function useStemMixer(stems: StemSpec[]) {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const tracksRef = useRef<Map<string, TrackNodes>>(new Map());

  const startedAtRef = useRef(0); // ctx time the current run began
  const startOffsetRef = useRef(0); // song position that run began from
  const playingRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tracks, setTracks] = useState<TrackState[]>([]);
  const [masterVolume, setMasterVol] = useState(1);

  const trackStateRef = useRef<TrackState[]>([]);
  trackStateRef.current = tracks;

  const ensureContext = useCallback(() => {
    if (!ctxRef.current) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new Ctor();
      const master = ctx.createGain();
      master.gain.value = 1;
      master.connect(ctx.destination);
      ctxRef.current = ctx;
      masterRef.current = master;
    }
    return ctxRef.current;
  }, []);

  // ---- load + decode all stems ----
  const urlKey = stems.map((s) => s.url).join("|");
  useEffect(() => {
    if (stems.length === 0) return;
    let cancelled = false;
    setStatus("loading");
    (async () => {
      try {
        const ctx = ensureContext();
        const results = await Promise.all(
          stems.map(async (s) => {
            try {
              const res = await fetch(s.url);
              if (!res.ok) throw new Error(`fetch ${res.status}`);
              const arr = await res.arrayBuffer();
              const buffer = await ctx.decodeAudioData(arr);
              return { s, buffer, failed: false as const };
            } catch {
              return { s, buffer: null, failed: true as const };
            }
          }),
        );
        if (cancelled) return;
        let maxDur = 0;
        for (const r of results) {
          if (!r.buffer) continue;
          const gain = ctx.createGain();
          gain.gain.value = 1;
          gain.connect(masterRef.current!);
          tracksRef.current.set(r.s.id, { buffer: r.buffer, gain, source: null });
          maxDur = Math.max(maxDur, r.buffer.duration);
        }
        setDuration(maxDur);
        setTracks(
          results.map((r) => ({
            id: r.s.id,
            label: r.s.label,
            volume: 1,
            muted: false,
            soloed: false,
            failed: r.failed,
          })),
        );
        setStatus(maxDur > 0 ? "ready" : "error");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlKey]);

  const applyGains = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const states = trackStateRef.current;
    const anySolo = states.some((t) => t.soloed);
    for (const t of states) {
      const node = tracksRef.current.get(t.id);
      if (!node) continue;
      const audible = t.muted ? false : anySolo ? t.soloed : true;
      node.gain.gain.setTargetAtTime(audible ? t.volume : 0, ctx.currentTime, RAMP);
    }
  }, []);

  useEffect(() => {
    applyGains();
  }, [tracks, applyGains]);

  const stopSources = useCallback(() => {
    for (const [, node] of tracksRef.current) {
      if (node.source) {
        try {
          node.source.onended = null;
          node.source.stop();
        } catch {
          /* already stopped */
        }
        node.source.disconnect();
        node.source = null;
      }
    }
  }, []);

  const startSources = useCallback((offset: number) => {
    const ctx = ctxRef.current!;
    const when = ctx.currentTime + START_LEAD;
    for (const [, node] of tracksRef.current) {
      if (offset >= node.buffer.duration) {
        node.source = null;
        continue;
      }
      const src = ctx.createBufferSource();
      src.buffer = node.buffer;
      src.connect(node.gain);
      src.start(when, offset);
      node.source = src;
    }
    startedAtRef.current = when;
    startOffsetRef.current = offset;
  }, []);

  const currentPosition = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || !playingRef.current) return startOffsetRef.current;
    return ctx.currentTime - startedAtRef.current + startOffsetRef.current;
  }, []);

  const tick = useCallback(() => {
    const pos = currentPosition();
    if (pos >= duration) {
      stopSources();
      playingRef.current = false;
      setIsPlaying(false);
      startOffsetRef.current = 0;
      setPosition(duration);
      return;
    }
    setPosition(Math.max(0, pos));
    rafRef.current = requestAnimationFrame(tick);
  }, [currentPosition, duration, stopSources]);

  const play = useCallback(async () => {
    const ctx = ensureContext();
    if (ctx.state === "suspended") await ctx.resume(); // iOS unlock
    if (playingRef.current) return;
    let offset = startOffsetRef.current;
    if (offset >= duration) offset = 0;
    applyGains();
    startSources(offset);
    playingRef.current = true;
    setIsPlaying(true);
    rafRef.current = requestAnimationFrame(tick);
  }, [ensureContext, duration, applyGains, startSources, tick]);

  const pause = useCallback(() => {
    if (!playingRef.current) return;
    const pos = currentPosition();
    stopSources();
    playingRef.current = false;
    setIsPlaying(false);
    startOffsetRef.current = Math.min(Math.max(0, pos), duration);
    setPosition(startOffsetRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, [currentPosition, stopSources, duration]);

  const seek = useCallback(
    (to: number) => {
      const clamped = Math.max(0, Math.min(to, duration));
      const wasPlaying = playingRef.current;
      if (wasPlaying) stopSources();
      startOffsetRef.current = clamped;
      setPosition(clamped);
      if (wasPlaying) startSources(clamped);
    },
    [duration, stopSources, startSources],
  );

  const setVolume = useCallback((id: string, v: number) => {
    setTracks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, volume: Math.max(0, Math.min(1, v)) } : t,
      ),
    );
  }, []);

  const toggleMute = useCallback((id: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, muted: !t.muted } : t)),
    );
  }, []);

  const toggleSolo = useCallback((id: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, soloed: !t.soloed } : t)),
    );
  }, []);

  const setMasterVolume = useCallback((v: number) => {
    const val = Math.max(0, Math.min(1, v));
    setMasterVol(val);
    const ctx = ctxRef.current;
    if (ctx && masterRef.current) {
      masterRef.current.gain.setTargetAtTime(val, ctx.currentTime, RAMP);
    }
  }, []);

  const getBuffer = useCallback(
    (id: string) => tracksRef.current.get(id)?.buffer ?? null,
    [],
  );

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      for (const [, node] of tracksRef.current) {
        try {
          node.source?.stop();
        } catch {
          /* noop */
        }
        node.source?.disconnect();
        node.gain.disconnect();
      }
      tracksRef.current.clear();
      masterRef.current?.disconnect();
      void ctxRef.current?.close().catch(() => {});
      ctxRef.current = null;
    };
  }, []);

  return {
    status,
    duration,
    position,
    isPlaying,
    tracks,
    masterVolume,
    play,
    pause,
    seek,
    setVolume,
    toggleMute,
    toggleSolo,
    setMasterVolume,
    getBuffer,
  };
}
