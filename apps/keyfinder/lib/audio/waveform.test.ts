import { describe, expect, it } from "vitest";
import { computePeaks } from "./waveform";

// Minimal AudioBuffer stand-in: computePeaks only reads getChannelData(0).
function fakeBuffer(data: number[]): AudioBuffer {
  const arr = Float32Array.from(data);
  return { getChannelData: () => arr } as unknown as AudioBuffer;
}

describe("computePeaks", () => {
  it("captures the min/max within each column", () => {
    // 8 samples, width 2 → step 4: col0 = [-0.5..0.5], col1 = [-1..0.25]
    const peaks = computePeaks(
      fakeBuffer([0.1, 0.5, -0.5, 0.2, -1, 0.25, 0, -0.3]),
      2,
    );
    expect(peaks.length).toBe(4);
    expect(peaks[0]).toBeCloseTo(-0.5); // min col0
    expect(peaks[1]).toBeCloseTo(0.5); // max col0
    expect(peaks[2]).toBeCloseTo(-1); // min col1
    expect(peaks[3]).toBeCloseTo(0.25); // max col1
  });

  it("always returns width*2 entries and never leaves min>max", () => {
    const peaks = computePeaks(fakeBuffer([0.2]), 4);
    expect(peaks.length).toBe(8);
    for (let i = 0; i < 4; i++) {
      expect(peaks[i * 2]).toBeLessThanOrEqual(peaks[i * 2 + 1]);
    }
  });
});
