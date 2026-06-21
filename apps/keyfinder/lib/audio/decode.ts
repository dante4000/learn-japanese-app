// Browser-side audio decoding: turn an uploaded File into a mono Float32Array
// resampled to a low rate suitable for analysis. Runs on the main thread
// (Web Audio APIs aren't available in workers).

export interface DecodedAudio {
  samples: Float32Array;
  sampleRate: number;
  /** Seconds actually analysed (capped). */
  duration: number;
  /** True if the source was longer than the analysis cap. */
  truncated: boolean;
}

const TARGET_RATE = 22050;
const MAX_SECONDS = 180; // analyse up to 3 minutes

type ACtor = typeof AudioContext;
type OACtor = typeof OfflineAudioContext;

export async function decodeFileToMono(file: File): Promise<DecodedAudio> {
  const AC: ACtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: ACtor }).webkitAudioContext;
  const OAC: OACtor =
    window.OfflineAudioContext ||
    (window as unknown as { webkitOfflineAudioContext: OACtor }).webkitOfflineAudioContext;
  if (!AC || !OAC) throw new Error("Web Audio is not supported in this browser.");

  const arrayBuf = await file.arrayBuffer();
  const tmp = new AC();
  let decoded: AudioBuffer;
  try {
    decoded = await tmp.decodeAudioData(arrayBuf);
  } catch {
    throw new Error("Could not decode this file — try MP3, WAV, M4A, or OGG.");
  } finally {
    void tmp.close?.();
  }

  const srcLen = Math.min(decoded.length, Math.floor(decoded.sampleRate * MAX_SECONDS));
  const truncated = decoded.length > srcLen;
  const dur = srcLen / decoded.sampleRate;
  const outLen = Math.max(1, Math.ceil(dur * TARGET_RATE));

  // Render a mono mixdown through an offline context to resample cleanly.
  const off = new OAC(1, outLen, TARGET_RATE);
  const monoBuf = off.createBuffer(1, srcLen, decoded.sampleRate);
  const mono = monoBuf.getChannelData(0);
  const ch = decoded.numberOfChannels;
  for (let c = 0; c < ch; c++) {
    const data = decoded.getChannelData(c);
    for (let i = 0; i < srcLen; i++) mono[i] += data[i] / ch;
  }
  const src = off.createBufferSource();
  src.buffer = monoBuf;
  src.connect(off.destination);
  src.start();
  const rendered = await off.startRendering();

  return {
    samples: rendered.getChannelData(0).slice(),
    sampleRate: TARGET_RATE,
    duration: dur,
    truncated,
  };
}
