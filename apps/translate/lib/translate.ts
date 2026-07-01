import { spawn } from "node:child_process";

export const CLAUDE_BIN = process.env.CLAUDE_BIN ?? "claude";
export const TRANSLATOR_MODEL = process.env.TRANSLATOR_MODEL; // e.g. "haiku" for max speed
export const CHUNK_SIZE = Number(process.env.TRANSLATOR_CHUNK_SIZE ?? 20);

// --- Backend selection ---------------------------------------------------
// Default is Claude (via the local `claude` CLI). `translate --local` sets
// TRANSLATE_BACKEND=local to use a fully offline model through Ollama instead.
export type Backend = "claude" | "local";
export function backend(): Backend {
  return process.env.TRANSLATE_BACKEND === "local" ? "local" : "claude";
}

// Local (Ollama) config.
export const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://127.0.0.1:11434";
// gemma3:27b measured ~2s/line with output identical to qwen2.5:72b (~40-60s/line
// on 64GB — memory-bound) on lyric-length lines; qwen stays available on the LaCie
// via TRANSLATE_LOCAL_MODEL=qwen2.5:72b for long/complex prose.
export const LOCAL_MODEL = process.env.TRANSLATE_LOCAL_MODEL ?? "gemma3:27b";

const CLAUDE_CONCURRENCY = 4; // batched chunks in flight at once
const LOCAL_CONCURRENCY = Number(process.env.TRANSLATE_LOCAL_CONCURRENCY ?? 4);

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

/**
 * Pull a single translation out of a model's (possibly chatty) output: strip any
 * <think> block, then take the <t>…</t> contents, falling back to the cleaned raw.
 */
export function extractTranslation(raw: string): string {
  const noThink = raw.replace(/<think>[\s\S]*?<\/think>/gi, "");
  const m = noThink.match(/<t>([\s\S]*?)<\/t>/i);
  return (m ? m[1] : noThink).trim();
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

    const opts: Parameters<typeof spawn>[2] = { stdio: ["pipe", "pipe", "pipe"], env };

    // When the server runs as root (the always-on port-80 service), drop the
    // `claude` child to the real user so it uses their file-based login and never
    // writes root-owned files into their ~/.claude. No-op for `npm run dev`.
    const asRoot = typeof process.getuid === "function" && process.getuid() === 0;
    const runAsUid = Number(process.env.TRANSLATE_UID);
    if (asRoot && runAsUid) {
      opts.uid = runAsUid;
      const gid = Number(process.env.TRANSLATE_GID);
      if (gid) opts.gid = gid;
      if (process.env.TRANSLATE_HOME) env.HOME = process.env.TRANSLATE_HOME;
      if (process.env.TRANSLATE_USER) {
        env.USER = process.env.TRANSLATE_USER;
        env.LOGNAME = process.env.TRANSLATE_USER;
      }
    }

    const child = spawn(bin, args, opts);

    let out = "";
    let err = "";
    child.stdout!.on("data", (d) => (out += d.toString()));
    child.stderr!.on("data", (d) => (err += d.toString()));

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

    child.stdin!.write(prompt);
    child.stdin!.end();
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

// --- Local backend (Ollama) ---------------------------------------------

/** Prompt for translating one line with a local instruct model. */
export function buildLocalPrompt(line: string): string {
  return (
    "Translate the following line into English. Output ONLY the English " +
    "translation wrapped in <t></t> tags — no notes, no commentary, no " +
    "transliteration. If it is already English, wrap it unchanged.\n\n" +
    `Line: ${line}`
  );
}

/** Call the local Ollama server and return the raw generated text. */
export async function runOllama(prompt: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: LOCAL_MODEL,
        prompt,
        stream: false,
        think: false, // suppress reasoning models' <think> output
        options: { temperature: 0.2 },
      }),
    });
  } catch {
    throw new Error(`Can't reach the local model at ${OLLAMA_URL}. Is Ollama running?`);
  }
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Local model "${LOCAL_MODEL}" not installed. Run: ollama pull ${LOCAL_MODEL}`);
    }
    throw new Error(`Ollama returned HTTP ${res.status}`);
  }
  const data = (await res.json()) as { response?: string };
  return String(data.response ?? "");
}

/** Translate a single line with the local model. */
export async function translateLineLocal(
  line: string,
  deps: TranslateDeps = {},
): Promise<string> {
  const run = deps.run ?? runOllama;
  return extractTranslation(await run(buildLocalPrompt(line)));
}

// --- Unified streaming dispatch -----------------------------------------

export type ResultSink = (
  index: number,
  translation: string | null,
  errorMessage?: string,
) => void;

/** Run `worker` over `items` with at most `limit` in flight at once. */
async function pool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>): Promise<void> {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(Math.max(1, limit), items.length) }, async () => {
    for (;;) {
      const i = cursor++;
      if (i >= items.length) return;
      await worker(items[i]);
    }
  });
  await Promise.all(runners);
}

/**
 * Translate `content` lines, invoking `onResult(index, translation | null, err?)`
 * as each finishes. Dispatches on the active backend: Claude batches many lines
 * per CLI call; the local model translates line-by-line (cheap — the Ollama
 * server keeps the model resident, so there's no per-call spawn cost).
 */
/** A line with no letters (e.g. "...", "—", "♪") has nothing to translate. */
export function isUntranslatable(text: string): boolean {
  return !/\p{L}/u.test(text);
}

export async function streamTranslations(
  content: SourceLine[],
  onResult: ResultSink,
  deps: TranslateDeps = {},
): Promise<void> {
  // Pass through lines with nothing to translate (punctuation/symbols only) so no
  // model ever sees them — some ramble when asked to translate "…".
  const work: SourceLine[] = [];
  for (const line of content) {
    if (isUntranslatable(line.text)) onResult(line.index, line.text.trim());
    else work.push(line);
  }
  content = work;

  if (backend() === "local") {
    await pool(content, LOCAL_CONCURRENCY, async (line) => {
      try {
        onResult(line.index, await translateLineLocal(line.text, deps));
      } catch (e) {
        onResult(line.index, null, e instanceof Error ? e.message : "Translation failed.");
      }
    });
    return;
  }

  // Claude: batch into chunks, several chunks in flight at once.
  await pool(chunk(content, CHUNK_SIZE), CLAUDE_CONCURRENCY, async (group) => {
    try {
      const map = await translateBatch(group, deps);
      for (const line of group) {
        const t = map.get(line.index);
        if (t !== undefined) onResult(line.index, t);
        else onResult(line.index, null, "No translation returned.");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Translation failed.";
      for (const line of group) onResult(line.index, null, msg);
    }
  });
}
