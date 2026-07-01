# Translate

Paste a big chunk of text and it translates into **English one line at a time**,
streaming each finished line into the UI live. The backend uses your local
**Claude Code / Claude Max** session — no API key, no per-token cost.

## How it works

- `app/page.tsx` — client UI: renders a skeleton of every line instantly, then
  fills each in with its English translation by index as results stream.
- `app/api/translate/route.ts` — streaming NDJSON endpoint. Emits an `init` event
  (all originals) immediately, then translates content lines in **batches** with
  bounded concurrency, streaming a `translated` event per line. Blank lines are
  preserved for stanza breaks; a dropped/failed line is marked.
- `lib/translate.ts` — `splitLines()`, `chunk()`, `buildBatchPrompt()`,
  `parseBatch()`, `runClaude()` (spawns the local `claude -p` CLI), `translateBatch()`.

### Speed

Each `claude -p` spawn costs ~3s of fixed startup, so the original per-line approach
paid that tax on every line. **Batching** many lines into one call amortizes it —
~15–20× faster on real input (a 10-line, 9-language test runs in ~9s). Knobs:

- `TRANSLATOR_MODEL=haiku` — use Haiku 4.5 for the fastest per-call latency.
- `TRANSLATOR_CHUNK_SIZE` — lines per call (default 20).
- `CONCURRENCY` in the route — chunks translated in parallel (default 4).

### Why the local `claude` CLI

A Claude Max subscription can't be plugged into an app as an API — it powers
claude.ai and Claude Code, not a programmable endpoint. But Claude Code *runs* on
your Max plan, so the backend shells out to `claude -p` per line. That means it
only works **locally**, where Claude Code is installed and logged in — not when
deployed to a server.

Two implementation notes baked into `runClaude`:
- **Env is sanitized** — Claude Code session vars (`CLAUDECODE`, `CLAUDE_CODE_*`,
  …) are stripped so it spawns a fresh session, not a confused nested one.
- **Output is tag-wrapped** — `claude -p` runs the full coding agent, which likes
  to add preambles. We ask for the translation inside `<t></t>` and parse it out,
  which is reliable across languages.

Optional: set `CLAUDE_BIN` to point at a specific `claude` binary.

## Run

On demand (recommended) — starts it at **http://translate**, opens your browser,
and stops the instant you close the window or press Ctrl-C. Nothing runs while
you're not using it:

```bash
translate           # Claude Max backend (via the local `claude` CLI)
translate --local   # fully offline — a local model via Ollama, no Claude at all
```

It asks for your password once per start (only to bind the clean port 80); the
`claude` translator itself runs as you, not root.

### Backends

- **Default (Claude):** batches lines through the local `claude` CLI (your Max plan).
- **`--local` (offline):** translates line-by-line through **Ollama** — no network,
  no Claude, no account. First run auto-pulls the model. Because Ollama keeps the
  model resident, per-line calls are cheap (no spawn tax), so batching isn't needed.

Local config (env):

- `TRANSLATE_LOCAL_MODEL` — Ollama model tag (default `gemma3:27b`: ~2s/line and, in
  measured tests, output identical to `qwen2.5:72b` on lyric-length lines. Qwen-72B
  is downloaded on the LaCie for max-accuracy long-prose runs, but is memory-bound
  at ~40-60s/line on 64GB).
- Big models live on the LaCie external drive (`/Volumes/dante lacie/ollama-models`,
  via `OLLAMA_MODELS`) because the internal disk is nearly full. If the LaCie isn't
  mounted, the launcher falls back to the internal store with `gemma3:12b`
  (`TRANSLATE_FALLBACK_MODEL` to change). Pulls retry automatically — the registry
  sometimes EOFs mid-download.
- `TRANSLATE_LOCAL_CONCURRENCY` — parallel line requests to Ollama (default 4).
- `OLLAMA_URL` — Ollama endpoint (default `http://127.0.0.1:11434`).

The backend is chosen in `lib/translate.ts` via `TRANSLATE_BACKEND` (`claude` |
`local`); `streamTranslations` dispatches and streams each line as it lands.

Dev / test:

```bash
npm install
npm run dev     # http://localhost:3000  (requires Claude Code installed + logged in)
npm test        # unit tests (21, no tokens/CLI/network — runners are mocked)
npm run build   # production build
```

## Deploy

Not deployable as-is: the backend depends on the local `claude` CLI, which won't
exist on Vercel. To deploy, swap `runClaude` for an API-backed translator (e.g. the
Vercel AI Gateway with `anthropic/claude-opus-4-8`) — the rest of the app is
unchanged.
