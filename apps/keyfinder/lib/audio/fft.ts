// Hand-written radix-2 Cooley–Tukey FFT — no dependencies.
// Operates in place on parallel real / imaginary arrays whose length is a
// power of two. This is the numeric core every other DSP stage builds on.

/** In-place iterative radix-2 FFT. `re.length` must be a power of two. */
export function fft(re: Float32Array, im: Float32Array): void {
  const n = re.length;
  if (n <= 1) return;

  // bit-reversal permutation
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i];
      re[i] = re[j];
      re[j] = tr;
      const ti = im[i];
      im[i] = im[j];
      im[j] = ti;
    }
  }

  // butterflies
  for (let len = 2; len <= n; len <<= 1) {
    const half = len >> 1;
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < half; k++) {
        const a = i + k;
        const b = a + half;
        const tr = re[b] * cr - im[b] * ci;
        const ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
        const ncr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = ncr;
      }
    }
  }
}

/** Largest power of two <= n. */
export function prevPow2(n: number): number {
  let p = 1;
  while (p * 2 <= n) p *= 2;
  return p;
}

/** A Hann analysis window of the given size. */
export function hann(size: number): Float32Array {
  const w = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1));
  }
  return w;
}
