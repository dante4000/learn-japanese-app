// Encode (optionally-trimmed) PCM channel data to a 16-bit WAV blob.
// Used to make a cheap short "preview" clip before uploading to LALAL.

export interface PcmSource {
  sampleRate: number;
  channels: Float32Array[]; // one Float32Array per channel
}

/**
 * Encode PCM to a 16-bit interleaved WAV ArrayBuffer, keeping at most
 * `maxSeconds` of audio (undefined = whole thing).
 */
export function encodeWav(src: PcmSource, maxSeconds?: number): ArrayBuffer {
  const numCh = Math.max(1, src.channels.length);
  const total = src.channels[0]?.length ?? 0;
  const cap =
    maxSeconds != null
      ? Math.min(total, Math.floor(maxSeconds * src.sampleRate))
      : total;
  const frames = Math.max(0, cap);

  const bytesPerSample = 2;
  const blockAlign = numCh * bytesPerSample;
  const dataSize = frames * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numCh, true);
  view.setUint32(24, src.sampleRate, true);
  view.setUint32(28, src.sampleRate * blockAlign, true); // byte rate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits per sample
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < frames; i++) {
    for (let ch = 0; ch < numCh; ch++) {
      const sample = src.channels[ch][i] ?? 0;
      const clamped = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
      offset += 2;
    }
  }
  return buffer;
}
