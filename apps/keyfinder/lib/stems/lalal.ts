// Server-side LALAL.AI API v1 client + pure helpers.
// The license key is read from process.env.LALAL_LICENSE and never leaves the server.
// Docs: https://www.lalal.ai/api/v1/openapi.json  (auth header: X-License-Key)

import type { CheckResult, StemTrack } from "./types";

export const LALAL_BASE = "https://www.lalal.ai/api/v1";

// All stems LALAL can isolate via /split/stem_separator/ (splitter "auto" picks
// the best model per stem — phoenix for synth/strings/wind). "drums" -> "drum".
export const UI_STEMS = [
  "vocals",
  "drums",
  "bass",
  "piano",
  "electric_guitar",
  "acoustic_guitar",
  "synthesizer",
  "strings",
  "wind",
] as const;
export type UiStem = (typeof UI_STEMS)[number];

const UI_TO_LALAL: Record<UiStem, string> = {
  vocals: "vocals",
  drums: "drum",
  bass: "bass",
  piano: "piano",
  electric_guitar: "electric_guitar",
  acoustic_guitar: "acoustic_guitar",
  synthesizer: "synthesizer",
  strings: "strings",
  wind: "wind",
};

const STEM_NAMES: Record<string, string> = {
  vocals: "Vocals",
  drum: "Drums",
  bass: "Bass",
  piano: "Piano",
  electric_guitar: "Electric guitar",
  acoustic_guitar: "Acoustic guitar",
  synthesizer: "Synth",
  strings: "Strings",
  wind: "Wind",
};

export function isUiStem(s: string): s is UiStem {
  return (UI_STEMS as readonly string[]).includes(s);
}

export function toLalalStem(uiStem: string): string | null {
  return isUiStem(uiStem) ? UI_TO_LALAL[uiStem] : null;
}

/** Map + validate a list of UI stem ids to LALAL enum values (deduped). */
export function toLalalStems(uiStems: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of uiStems) {
    const mapped = toLalalStem(s);
    if (mapped && !seen.has(mapped)) {
      seen.add(mapped);
      out.push(mapped);
    }
  }
  return out;
}

/** Body for POST /split/stem_separator/ (one stem per task). */
export function buildStemBody(sourceId: string, lalalStem: string) {
  return {
    source_id: sourceId,
    presets: {
      stem: lalalStem,
      splitter: "auto",
      extraction_level: "deep_extraction",
    },
    idempotency_key: null,
  };
}

/** Human name for a LALAL track label. `no_vocals` = Instrumental; other `no_*` = Backing. */
export function trackName(label: string): string {
  if (label === "no_vocals") return "Instrumental";
  if (label.startsWith("no_")) return "Backing";
  return STEM_NAMES[label] ?? label;
}

type Entry = {
  status?: string;
  progress?: number;
  result?: { duration?: number; tracks?: Array<Record<string, unknown>> };
  error?: { detail?: string; code?: string };
};

/**
 * Aggregate a /check/ response across N stem tasks into one status.
 * `keepBacking` keeps the `no_*` complement tracks (used for a single-stem
 * split, e.g. vocals -> Vocals + Instrumental); otherwise only isolated stems.
 */
export function aggregateCheck(
  json: unknown,
  taskIds: string[],
  rewriteUrl: (url: string) => string,
  keepBacking: boolean,
): CheckResult {
  const result = (json as { result?: Record<string, Entry> })?.result ?? {};
  const entries = taskIds.map((id) => result[id]);

  // All tasks absent → terminal unknown (expired / bad ids). If only SOME are
  // absent it may be a transient first-poll race, so we keep polling; the
  // caller's poll deadline is the backstop against a persistent stall.
  if (entries.every((e) => !e || typeof e.status !== "string")) {
    return { status: "unknown" };
  }

  for (const e of entries) {
    if (e?.status === "error") {
      return { status: "error", error: e.error?.detail || e.error?.code || "Split failed." };
    }
    if (e?.status === "server_error") {
      return { status: "error", error: "This upload expired — please try again." };
    }
    if (e?.status === "cancelled") return { status: "cancelled" };
  }

  const allSuccess = entries.every((e) => e?.status === "success");
  if (allSuccess) {
    const tracks: StemTrack[] = [];
    let duration = 0;
    for (const e of entries) {
      const r = e!.result;
      duration = Math.max(duration, r?.duration ?? 0);
      const raw = Array.isArray(r?.tracks) ? r!.tracks! : [];
      for (const t of raw) {
        if (typeof t.url !== "string") continue;
        const label = String(t.label ?? "");
        const type = t.type === "stem" ? "stem" : "back";
        if (type === "back" && !keepBacking) continue;
        tracks.push({
          label,
          name: trackName(label),
          type,
          url: rewriteUrl(String(t.url)),
        });
      }
    }
    return { status: "success", duration, tracks };
  }

  // Still running — average per-task percent (success=100, queued/absent=0).
  const pct =
    entries.reduce((sum, e) => {
      if (e?.status === "success") return sum + 100;
      if (e?.status === "progress") return sum + Math.max(0, e.progress ?? 0);
      return sum;
    }, 0) / Math.max(1, entries.length);
  return { status: "progress", progress: pct };
}

// ---- network calls (require the license key) ----

export class LalalConfigError extends Error {
  constructor() {
    super("Stem splitting isn't configured on this server.");
    this.name = "LalalConfigError";
  }
}

function license(): string {
  const key = process.env.LALAL_LICENSE;
  if (!key) throw new LalalConfigError();
  return key;
}

// Returns the balance, or null if the balance couldn't be read (so callers can
// distinguish an API error from a genuine zero).
export async function lalalMinutesLeft(): Promise<number | null> {
  try {
    const res = await fetch(`${LALAL_BASE}/limits/minutes_left/`, {
      method: "POST",
      headers: { "X-License-Key": license() },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { minutes_left?: number };
    return typeof json.minutes_left === "number" ? json.minutes_left : null;
  } catch {
    return null;
  }
}

export async function lalalCancel(taskIds: string[]): Promise<void> {
  if (taskIds.length === 0) return;
  await fetch(`${LALAL_BASE}/cancel/`, {
    method: "POST",
    headers: { "X-License-Key": license(), "Content-Type": "application/json" },
    body: JSON.stringify({ task_ids: taskIds }),
  });
}

export async function lalalUpload(
  file: ArrayBuffer,
  filename: string,
): Promise<{ id: string; name: string; duration: number }> {
  const res = await fetch(`${LALAL_BASE}/upload/`, {
    method: "POST",
    headers: {
      "X-License-Key": license(),
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename*=utf-8''${encodeURIComponent(filename)}`,
    },
    body: file,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((json as { detail?: string }).detail || "Upload to LALAL failed.");
  }
  const j = json as { id: string; name: string; duration: number };
  return { id: j.id, name: j.name, duration: j.duration };
}

async function startOneStem(sourceId: string, stem: string): Promise<string> {
  const res = await fetch(`${LALAL_BASE}/split/stem_separator/`, {
    method: "POST",
    headers: { "X-License-Key": license(), "Content-Type": "application/json" },
    body: JSON.stringify(buildStemBody(sourceId, stem)),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((json as { detail?: string }).detail || "Could not start the split.");
  }
  return (json as { task_id: string }).task_id;
}

/**
 * Start one stem_separator task per requested stem, concurrently. If any task
 * fails to start, cancel the ones that did (so we don't leak minutes on
 * orphaned tasks) and throw.
 */
export async function lalalSplitStems(
  sourceId: string,
  uiStems: string[],
): Promise<string[]> {
  const lalalStems = toLalalStems(uiStems);
  const settled = await Promise.allSettled(
    lalalStems.map((stem) => startOneStem(sourceId, stem)),
  );
  const started = settled
    .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
    .map((r) => r.value);
  const failed = settled.find((r) => r.status === "rejected") as
    | PromiseRejectedResult
    | undefined;
  if (failed) {
    if (started.length) await lalalCancel(started).catch(() => {});
    throw failed.reason instanceof Error
      ? failed.reason
      : new Error("Could not start the split.");
  }
  return started;
}

export async function lalalCheckRaw(taskIds: string[]): Promise<unknown> {
  const res = await fetch(`${LALAL_BASE}/check/`, {
    method: "POST",
    headers: { "X-License-Key": license(), "Content-Type": "application/json" },
    body: JSON.stringify({ task_ids: taskIds }),
  });
  if (!res.ok) throw new Error("Could not check split status.");
  return res.json();
}
