// Runs the analysis in a Web Worker, falling back to the main thread if the
// worker can't be created or dies. Returns a promise plus streamed progress.

import { analyzePcm, type AnalysisResult } from "./analyze";
import type { WorkerResponse } from "./worker";

export function runAnalysis(
  samples: Float32Array,
  sampleRate: number,
  onProgress: (progress: number, stage: string) => void,
): Promise<AnalysisResult> {
  return new Promise((resolve, reject) => {
    const onMainThread = () => {
      // Defer so the UI can paint the "analyzing" state first.
      setTimeout(() => {
        try {
          resolve(analyzePcm(samples, sampleRate, onProgress));
        } catch (e) {
          reject(e instanceof Error ? e : new Error(String(e)));
        }
      }, 0);
    };

    let worker: Worker;
    try {
      worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    } catch {
      onMainThread();
      return;
    }

    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const msg = e.data;
      if (msg.type === "progress") {
        onProgress(msg.progress, msg.stage);
      } else if (msg.type === "result") {
        worker.terminate();
        resolve(msg.result);
      } else if (msg.type === "error") {
        worker.terminate();
        reject(new Error(msg.message));
      }
    };

    worker.onerror = () => {
      worker.terminate();
      onMainThread();
    };

    // No transfer list: we keep `samples` valid for the fallback path.
    worker.postMessage({ samples, sampleRate });
  });
}
