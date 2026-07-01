"use client";

import { upload } from "@vercel/blob/client";

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

// Upload directly to Vercel Blob (no 4.5 MB limit), then have the server hand
// the bytes to LALAL and return the source id.
export async function uploadFile(file: File): Promise<UploadResult> {
  const blob = await upload(file.name, file, {
    access: "public",
    handleUploadUrl: "/api/stems/blob-upload",
    contentType: file.type || undefined,
  });
  const res = await fetch("/api/stems/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blobUrl: blob.url, filename: file.name }),
  });
  return (await jsonOrThrow(res)) as UploadResult;
}

export async function startSplit(
  sourceId: string,
  stems: string[],
): Promise<string> {
  const res = await fetch("/api/stems/split", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source_id: sourceId, stems }),
  });
  const json = (await jsonOrThrow(res)) as { task_id: string };
  return json.task_id;
}

export async function checkTask(taskId: string): Promise<CheckResult> {
  const res = await fetch("/api/stems/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task_ids: [taskId] }),
  });
  return (await jsonOrThrow(res)) as CheckResult;
}

export function downloadUrl(proxyUrl: string, name: string): string {
  // proxyUrl is already /api/stems/audio?url=... — append download flags.
  const sep = proxyUrl.includes("?") ? "&" : "?";
  return `${proxyUrl}${sep}download=1&name=${encodeURIComponent(name)}`;
}
