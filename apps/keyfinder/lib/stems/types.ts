// Wire types shared between the server (lalal.ts) and client (client.ts).
// Types only — safe to import from either side without bundling server code.

export interface StemTrack {
  label: string; // raw LALAL label, e.g. "vocals", "no_vocals"
  name: string; // human label
  type: "stem" | "back";
  url: string; // rewritten to our same-origin audio proxy
}

export type CheckResult =
  | { status: "progress"; progress: number }
  | { status: "success"; duration: number; tracks: StemTrack[] }
  | { status: "error"; error: string }
  | { status: "cancelled" }
  | { status: "unknown" };
