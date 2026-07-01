import { describe, expect, it } from "vitest";
import { encodeWav } from "./wav";

function readHeader(buf: ArrayBuffer) {
  const v = new DataView(buf);
  const str = (o: number, n: number) =>
    String.fromCharCode(...new Uint8Array(buf, o, n));
  return {
    riff: str(0, 4),
    wave: str(8, 4),
    channels: v.getUint16(22, true),
    sampleRate: v.getUint32(24, true),
    bits: v.getUint16(34, true),
    dataSize: v.getUint32(40, true),
  };
}

describe("encodeWav", () => {
  it("writes a valid 16-bit PCM header sized to the frames kept", () => {
    const channels = [Float32Array.from([0, 0.5, -0.5, 1, -1])]; // 5 mono frames
    const buf = encodeWav({ sampleRate: 8000, channels });
    const h = readHeader(buf);
    expect(h.riff).toBe("RIFF");
    expect(h.wave).toBe("WAVE");
    expect(h.channels).toBe(1);
    expect(h.sampleRate).toBe(8000);
    expect(h.bits).toBe(16);
    expect(h.dataSize).toBe(5 * 1 * 2); // frames * channels * 2 bytes
    expect(buf.byteLength).toBe(44 + 10);
  });

  it("caps output to maxSeconds", () => {
    const channels = [new Float32Array(8000)]; // 1s @ 8000Hz
    const buf = encodeWav({ sampleRate: 8000, channels }, 0.5);
    expect(readHeader(buf).dataSize).toBe(4000 * 2); // 0.5s = 4000 frames
  });

  it("interleaves stereo and clamps out-of-range samples", () => {
    const buf = encodeWav({
      sampleRate: 8000,
      channels: [Float32Array.from([2]), Float32Array.from([-2])], // 1 frame, both clamp
    });
    const v = new DataView(buf);
    expect(readHeader(buf).channels).toBe(2);
    expect(v.getInt16(44, true)).toBe(0x7fff); // L clamped to +1
    expect(v.getInt16(46, true)).toBe(-0x8000); // R clamped to -1
  });
});
