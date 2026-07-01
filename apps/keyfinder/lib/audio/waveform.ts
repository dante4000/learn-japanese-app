// Zero-dependency waveform peaks: min/max per pixel column from a decoded buffer.

/**
 * Downsample a channel of an AudioBuffer to `width` min/max pairs.
 * Returns a Float32Array laid out as [min0, max0, min1, max1, ...].
 */
export function computePeaks(buffer: AudioBuffer, width: number): Float32Array {
  const w = Math.max(1, Math.floor(width));
  const data = buffer.getChannelData(0);
  const peaks = new Float32Array(w * 2);
  const len = data.length;
  for (let x = 0; x < w; x++) {
    let min = 1.0;
    let max = -1.0;
    // Span the whole buffer with no gaps, including the tail (len not divisible
    // by w): column x covers [floor(x·len/w), floor((x+1)·len/w)).
    const start = Math.floor((x * len) / w);
    const end = Math.max(start + 1, Math.floor(((x + 1) * len) / w));
    for (let i = start; i < end && i < len; i++) {
      const v = data[i];
      if (v < min) min = v;
      if (v > max) max = v;
    }
    if (min > max) {
      min = 0;
      max = 0;
    }
    peaks[x * 2] = min;
    peaks[x * 2 + 1] = max;
  }
  return peaks;
}

/** Draw peaks into a canvas, tinting the played portion up to `progress` (0..1). */
export function drawWaveform(
  canvas: HTMLCanvasElement,
  peaks: Float32Array,
  color: string,
  progress = 0,
  playedColor?: string,
): void {
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const cssW = canvas.clientWidth || 1;
  const cssH = canvas.clientHeight || 1;
  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cssW, cssH);
  const amp = cssH / 2;
  const cols = peaks.length / 2;
  const playedX = progress * cssW;
  for (let x = 0; x < cssW; x++) {
    const col = Math.min(cols - 1, Math.floor((x / cssW) * cols));
    const min = peaks[col * 2];
    const max = peaks[col * 2 + 1];
    ctx.fillStyle = playedColor && x <= playedX ? playedColor : color;
    const y1 = (1 - max) * amp;
    const y2 = (1 - min) * amp;
    ctx.fillRect(x, y1, 1, Math.max(1, y2 - y1));
  }
}
