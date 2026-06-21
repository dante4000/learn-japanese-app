// Web Worker entry: runs the analysis pipeline off the main thread so the UI
// stays responsive, streaming progress updates back as it goes.

import { analyzePcm, type AnalysisResult } from "./analyze";

export type WorkerRequest = {
  samples: Float32Array;
  sampleRate: number;
};

export type WorkerResponse =
  | { type: "progress"; progress: number; stage: string }
  | { type: "result"; result: AnalysisResult }
  | { type: "error"; message: string };

const post = (msg: WorkerResponse) => (self as unknown as Worker).postMessage(msg);

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { samples, sampleRate } = e.data;
  try {
    const result = analyzePcm(samples, sampleRate, (progress, stage) =>
      post({ type: "progress", progress, stage }),
    );
    post({ type: "result", result });
  } catch (err) {
    post({ type: "error", message: err instanceof Error ? err.message : String(err) });
  }
};
