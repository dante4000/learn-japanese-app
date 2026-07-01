import { spawn } from "node:child_process";

export const CLAUDE_BIN = process.env.CLAUDE_BIN ?? "claude";
export const TRANSLATOR_MODEL = process.env.TRANSLATOR_MODEL; // e.g. "haiku" for max speed
export const CHUNK_SIZE = Number(process.env.TRANSLATOR_CHUNK_SIZE ?? 20);

export type LineKind = "content" | "blank";

export interface SourceLine {
  index: number;
  text: string;
  kind: LineKind;
}

/**
 * Split raw input into ordered lines, classifying each as blank or content.
 * Blank lines (empty or whitespace-only) are preserved so stanza breaks survive
 * the round trip. Handles CRLF and a single trailing newline without emitting a
 * spurious empty final line.
 */
export function splitLines(text: string): SourceLine[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const trimmed = normalized.endsWith("\n") ? normalized.slice(0, -1) : normalized;
  if (trimmed === "") return [];
  return trimmed.split("\n").map((text, index) => ({
    index,
    text,
    kind: text.trim() === "" ? "blank" : "content",
  }));
}

/** Break an array into fixed-size chunks. */
export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += Math.max(1, size)) {
    out.push(items.slice(i, i + Math.max(1, size)));
  }
  return out;
}

/**
 * Build one prompt that translates a batch of numbered lines in a single call.
 * Each line is tagged by its global index so results map back exactly, and the
 * <t N>…</t> wrapper survives the coding agent's tendency to add preamble.
 */
export function buildBatchPrompt(lines: SourceLine[]): string {
  const numbered = lines.map((l) => `${l.index}: ${l.text}`).join("\n");
  return (
    "Translate each numbered line below into natural, fluent English. " +
    "For every line, output its English translation on its own line as " +
    "`<t N>translation</t>`, where N is the line's number. Output ONLY those " +
    "tags — no preamble, no commentary. Translate every line, keeping each to " +
    "one line. If a line is already English, wrap it unchanged.\n\n" +
    numbered
  );
}

/** Parse `<t N>…</t>` tags out of the model output into an index→translation map. */
export function parseBatch(raw: string): Map<number, string> {
  const map = new Map<number, string>();
  const re = /<t\s*(\d+)\s*>([\s\S]*?)<\/t>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    map.set(Number(m[1]), m[2].trim());
  }
  return map;
}

/**
 * Run the local Claude Code CLI in headless mode and return its stdout.
 * Uses the machine's Claude Max session — no API key, no per-token cost.
 * Only works where Claude Code is installed and logged in (i.e. locally).
 */
export function runClaude(prompt: string, bin: string = CLAUDE_BIN): Promise<string> {
  return new Promise((resolve, reject) => {
    // Strip Claude Code session markers so this spawns a FRESH `claude`, not a
    // nested child of an existing session. No-op in a normal terminal.
    const env: NodeJS.ProcessEnv = { ...process.env };
    for (const key of Object.keys(env)) {
      if (key.startsWith("CLAUDE_CODE") || key === "CLAUDECODE" || key === "CLAUDE_EFFORT" || key === "AI_AGENT") {
        delete env[key];
      }
    }

    const args = ["-p"];
    if (TRANSLATOR_MODEL) args.push("--model", TRANSLATOR_MODEL);

    const child = spawn(bin, args, { stdio: ["pipe", "pipe", "pipe"], env });

    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d.toString()));
    child.stderr.on("data", (d) => (err += d.toString()));

    child.on("error", (e) => {
      reject(
        (e as NodeJS.ErrnoException).code === "ENOENT"
          ? new Error(`Claude Code CLI not found (\`${bin}\`). Make sure it's installed and on PATH.`)
          : e,
      );
    });

    child.on("close", (code) => {
      if (code === 0) resolve(out);
      else reject(new Error(err.trim() || `claude exited with code ${code}`));
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });
}

export interface TranslateDeps {
  run?: (prompt: string) => Promise<string>;
}

/**
 * Translate a batch of content lines in a single CLI call. Returns an
 * index→translation map. Lines the model drops are simply absent from the map.
 */
export async function translateBatch(
  lines: SourceLine[],
  deps: TranslateDeps = {},
): Promise<Map<number, string>> {
  if (lines.length === 0) return new Map();
  const run = deps.run ?? runClaude;
  return parseBatch(await run(buildBatchPrompt(lines)));
}
