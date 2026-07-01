# Lyrics Translator

Paste a big chunk of text and it translates into **English one line at a time**,
streaming each finished line into the UI live. The backend uses your local
**Claude Code / Claude Max** session — no API key, no per-token cost.

## How it works

- `app/page.tsx` — client UI: textarea + live streaming results (original ‖ English).
- `app/api/translate/route.ts` — streaming NDJSON endpoint. Splits input into lines
  and translates **sequentially, one line at a time**; blank lines pass through to
  preserve stanza breaks; a failed line is marked and the job continues.
- `lib/translate.ts` — `splitLines()`, `buildPrompt()`, `runClaude()` (spawns the
  local `claude -p` CLI), and `extractTranslation()`.

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

```bash
npm install
npm run dev     # http://localhost:3000  (requires Claude Code installed + logged in)
npm test        # unit tests (11, no tokens/CLI — the runner is mocked)
npm run build   # production build
```

## Deploy

Not deployable as-is: the backend depends on the local `claude` CLI, which won't
exist on Vercel. To deploy, swap `runClaude` for an API-backed translator (e.g. the
Vercel AI Gateway with `anthropic/claude-opus-4-8`) — the rest of the app is
unchanged.
