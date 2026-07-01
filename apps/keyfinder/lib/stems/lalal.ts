// Server-side LALAL.AI API v1 client + pure helpers.
// The license key is read from process.env.LALAL_LICENSE and never leaves the server.
// Docs: https://www.lalal.ai/api/v1/openapi.json  (auth header: X-License-Key)

export const LALAL_BASE = "https://www.lalal.ai/api/v1";

// The six stems multistem supports. Multistem returns a true partition:
// the chosen stems + one "no_multistem" backing track that sums to the original.
// (drum is singular in the API; UI uses "drums".)
export const UI_STEMS = [
  "vocals",
  "drums",
  "bass",
  "piano",
  "electric_guitar",
  "acoustic_guitar",
] as const;
export type UiStem = (typeof UI_STEMS)[number];

const UI_TO_LALAL: Record<UiStem, string> = {
  vocals: "vocals",
  drums: "drum",
  bass: "bass",
  piano: "piano",
  electric_guitar: "electric_guitar",
  acoustic_guitar: "acoustic_guitar",
};

// Human labels per LALAL stem label. Backing tracks are labeled `no_<stem>`
// (single stem) or `no_multistem` (several) — both handled by trackName().
export const TRACK_LABELS: Record<string, string> = {
  vocals: "Vocals",
  drum: "Drums",
  bass: "Bass",
  piano: "Piano",
  electric_guitar: "Electric guitar",
  acoustic_guitar: "Acoustic guitar",
};

/** Human-friendly name for a LALAL track label. Any `no_*` label is "Backing". */
export function trackName(label: string): string {
  if (label.startsWith("no_")) return "Backing";
  return TRACK_LABELS[label] ?? label;
}

/** True when a track label denotes the backing/instrumental remainder. */
export function isBackingLabel(label: string): boolean {
  return label.startsWith("no_");
}

export function isUiStem(s: string): s is UiStem {
  return (UI_STEMS as readonly string[]).includes(s);
}

/** Map UI stem ids to LALAL enum values, dropping anything unsupported. */
export function toLalalStems(uiStems: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of uiStems) {
    if (!isUiStem(s)) continue;
    const mapped = UI_TO_LALAL[s];
    if (!seen.has(mapped)) {
      seen.add(mapped);
      out.push(mapped);
    }
  }
  return out;
}

/** Body for POST /split/multistem/. */
export function buildSplitBody(sourceId: string, uiStems: string[]) {
  return {
    source_id: sourceId,
    presets: {
      stem_list: toLalalStems(uiStems),
      splitter: "auto",
      extraction_level: "deep_extraction",
    },
    idempotency_key: null,
  };
}

export interface NormalizedTrack {
  label: string; // raw LALAL label, e.g. "vocals", "no_multistem"
  name: string; // human label
  type: "stem" | "back";
  url: string; // rewritten to our audio proxy
}

export type NormalizedCheck =
  | { status: "progress"; progress: number }
  | { status: "success"; duration: number; tracks: NormalizedTrack[] }
  | { status: "error"; error: string }
  | { status: "cancelled" }
  | { status: "unknown" };

/**
 * Normalize a /check/ response entry for a single task id into a flat shape,
 * rewriting each download URL through `rewriteUrl` (our same-origin audio proxy).
 */
export function normalizeCheck(
  json: unknown,
  taskId: string,
  rewriteUrl: (url: string) => string,
): NormalizedCheck {
  const result = (json as { result?: Record<string, unknown> })?.result;
  const entry = result?.[taskId] as
    | { status?: string; progress?: number; result?: unknown; error?: unknown }
    | undefined;
  if (!entry || typeof entry.status !== "string") return { status: "unknown" };

  switch (entry.status) {
    case "progress":
      return { status: "progress", progress: Math.max(0, entry.progress ?? 0) };
    case "success": {
      const r = entry.result as
        | { duration?: number; tracks?: Array<Record<string, unknown>> }
        | undefined;
      const rawTracks = Array.isArray(r?.tracks) ? r!.tracks : [];
      const tracks: NormalizedTrack[] = rawTracks
        .filter((t) => typeof t.url === "string")
        .map((t) => {
          const label = String(t.label ?? "");
          return {
            label,
            name: trackName(label),
            type: t.type === "stem" ? "stem" : "back",
            url: rewriteUrl(String(t.url)),
          };
        });
      return { status: "success", duration: r?.duration ?? 0, tracks };
    }
    case "error": {
      const e = entry.error as { detail?: string; code?: string } | undefined;
      return { status: "error", error: e?.detail || e?.code || "Split failed." };
    }
    case "cancelled":
      return { status: "cancelled" };
    case "server_error":
      return { status: "error", error: "This upload expired — please try again." };
    default:
      return { status: "unknown" };
  }
}

// ---- network calls (require the license key) ----

function license(): string {
  const key = process.env.LALAL_LICENSE;
  if (!key) throw new LalalConfigError();
  return key;
}

export class LalalConfigError extends Error {
  constructor() {
    super("Stem splitting isn't configured on this server.");
    this.name = "LalalConfigError";
  }
}

export async function lalalMinutesLeft(): Promise<number> {
  const res = await fetch(`${LALAL_BASE}/limits/minutes_left/`, {
    method: "POST",
    headers: { "X-License-Key": license() },
  });
  if (!res.ok) return 0;
  const json = (await res.json()) as { minutes_left?: number };
  return json.minutes_left ?? 0;
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
    throw new Error(
      (json as { detail?: string }).detail || "Upload to LALAL failed.",
    );
  }
  const j = json as { id: string; name: string; duration: number };
  return { id: j.id, name: j.name, duration: j.duration };
}

export async function lalalSplit(
  sourceId: string,
  uiStems: string[],
): Promise<string> {
  const res = await fetch(`${LALAL_BASE}/split/multistem/`, {
    method: "POST",
    headers: {
      "X-License-Key": license(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildSplitBody(sourceId, uiStems)),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (json as { detail?: string }).detail || "Could not start the split.",
    );
  }
  return (json as { task_id: string }).task_id;
}

export async function lalalCheckRaw(taskIds: string[]): Promise<unknown> {
  const res = await fetch(`${LALAL_BASE}/check/`, {
    method: "POST",
    headers: {
      "X-License-Key": license(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ task_ids: taskIds }),
  });
  if (!res.ok) throw new Error("Could not check split status.");
  return res.json();
}
