"use client";

import { encodeWav } from "./wav";

// Decode an audio File and re-encode its first `seconds` as a WAV File.
// Used to make a cheap short "preview" clip before uploading to LALAL.
export async function fileToPreviewWav(
  file: File,
  seconds: number,
): Promise<File> {
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  const ctx = new Ctor();
  try {
    let buf: AudioBuffer;
    try {
      buf = await ctx.decodeAudioData(await file.arrayBuffer());
    } catch {
      throw new Error("Couldn't read that audio file — try a different format.");
    }
    const channels: Float32Array[] = [];
    for (let c = 0; c < buf.numberOfChannels; c++) {
      channels.push(buf.getChannelData(c));
    }
    const wav = encodeWav({ sampleRate: buf.sampleRate, channels }, seconds);
    const base = file.name.replace(/\.[^.]+$/, "");
    return new File([wav], `${base}-preview.wav`, { type: "audio/wav" });
  } finally {
    void ctx.close().catch(() => {});
  }
}
