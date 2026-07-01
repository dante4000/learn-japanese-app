import { spawn } from "node:child_process";

export const CLAUDE_BIN = process.env.CLAUDE_BIN ?? "claude";

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
  // Drop exactly one trailing newline so "a\n" is one line, not two.
  const trimmed = normalized.endsWith("\n")
    ? normalized.slice(0, -1)
    : normalized;

  if (trimmed === "") return [];

  return trimmed.split("\n").map((text, index) => ({
    index,
    text,
    kind: text.trim() === "" ? "blank" : "content",
  }));
}

/**
 * Build the instruction prompt for one line. `claude -p` runs the full Claude
 * Code agent, which tends to add preambles or echo the input — so we force the
 * translation into <t></t> tags and extract it afterward. This is far more
 * reliable than trying to get a bare one-line response.
 */
export function buildPrompt(line: string): string {
  return (
    "Translate the following line into English. Output the English translation " +
    "wrapped in <t></t> tags and nothing else. Keep it to one line. If it is " +
    "already English, wrap it unchanged.\n\n" +
    `Line: ${line}`
  );
}

/** Pull the translation out of the model's (possibly chatty) output. */
export function extractTranslation(raw: string): string {
  const match = raw.match(/<t>([\s\S]*?)<\/t>/i);
  return (match ? match[1] : raw).trim();
}

/**
 * Run the local Claude Code CLI in headless mode and return its stdout.
 * This uses the machine's Claude Max session — no API key, no per-token cost.
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

    const child = spawn(bin, ["-p"], { stdio: ["pipe", "pipe", "pipe"], env });

    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d.toString()));
    child.stderr.on("data", (d) => (err += d.toString()));

    child.on("error", (e) => {
      reject(
        (e as NodeJS.ErrnoException).code === "ENOENT"
          ? new Error(
              `Claude Code CLI not found (\`${bin}\`). Make sure it's installed and on PATH.`,
            )
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

/** Translate a single line into English via the local Claude CLI. */
export async function translateLine(
  line: string,
  deps: TranslateDeps = {},
): Promise<string> {
  const run = deps.run ?? runClaude;
  return extractTranslation(await run(buildPrompt(line)));
}
