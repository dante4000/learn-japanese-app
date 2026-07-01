"use client";

import { upload } from "@vercel/blob/client";
import { fileToPreviewWav } from "@/lib/audio/trim";

export interface UploadResult {
  id: string;
  name: string;
  duration: number;
  minutesLeft: number;
}

export interface StemTrack {
  label: string;
  name: string;
  type: "stem" | "back";
  url: string; // same-origin audio-proxy url
}

export type CheckResult =
  | { status: "progress"; progress: number }
  | { status: "success"; duration: number; tracks: StemTrack[] }
  | { status: "error"; error: string }
  | { status: "cancelled" }
  | { status: "unknown" };

async function jsonOrThrow(res: Response) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((json as { error?: string }).error || "Request failed.");
  }
  return json;
}

// Upload to Vercel Blob (no 4.5 MB limit), then have the server hand the bytes
// to LALAL. `previewSeconds` trims to a cheap short clip first.
export async function uploadFile(
  file: File,
  previewSeconds?: number,
): Promise<UploadResult> {
  const toSend = previewSeconds
    ? await fileToPreviewWav(file, previewSeconds)
    : file;
  const blob = await upload(toSend.name, toSend, {
    access: "public",
    handleUploadUrl: "/api/stems/blob-upload",
    contentType: toSend.type || undefined,
  });
  const res = await fetch("/api/stems/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blobUrl: blob.url, filename: toSend.name }),
  });
  return (await jsonOrThrow(res)) as UploadResult;
}

export async function startSplit(
  sourceId: string,
  stems: string[],
): Promise<string[]> {
  const res = await fetch("/api/stems/split", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source_id: sourceId, stems }),
  });
  const json = (await jsonOrThrow(res)) as { task_ids: string[] };
  return json.task_ids;
}

export async function checkTasks(taskIds: string[]): Promise<CheckResult> {
  const res = await fetch("/api/stems/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task_ids: taskIds }),
  });
  return (await jsonOrThrow(res)) as CheckResult;
}

export function downloadUrl(proxyUrl: string, name: string): string {
  const sep = proxyUrl.includes("?") ? "&" : "?";
  return `${proxyUrl}${sep}download=1&name=${encodeURIComponent(name)}`;
}
