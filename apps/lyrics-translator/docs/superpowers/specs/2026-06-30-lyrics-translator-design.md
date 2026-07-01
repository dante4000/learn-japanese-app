# Lyrics Translator — Design

**Date:** 2026-06-30
**Status:** Approved

## Purpose

Paste a big chunk of text (e.g. song lyrics). The app translates it into English
**one line at a time**, streaming each finished line into the UI live, then shows
the full assembled translation.

## Decisions

- **Target language:** Always English. Source is auto-detected by the model.
- **Line mode:** Stream lines live — process sequentially, render each translated
  line as it completes.
- **Backend (as built):** the local **Claude Code `claude -p` CLI**, which runs on
  the user's Claude Max session — no API key, no per-token cost. Works only locally.
  `runClaude` sanitizes Claude Code env vars (so it spawns a fresh, non-nested
  session) and wraps output in `<t></t>` tags that `extractTranslation` parses out,
  since the coding agent otherwise adds preambles / echoes. Context between lines was
  dropped: passing the previous line made the model merge and translate both.
  (The originally-specced Vercel AI Gateway path — `anthropic/claude-opus-4-8` +
  `AI_GATEWAY_API_KEY` — remains the swap-in for a deployable version.)

## Architecture

- `app/page.tsx` — Client UI. Textarea for input, "Translate" button, live results
  panel. Reads the streaming NDJSON response and appends each translated line as it
  arrives. Shows original + English per row.
- `app/api/translate/route.ts` — Streaming `POST` endpoint (Node runtime). Splits
  input into lines, loops **one line at a time**, calls Claude per non-blank line,
  and writes one NDJSON event per line to the response stream.
- `lib/translate.ts` — Pure helpers: `splitLines(text)` (split + classify blank vs
  content lines, preserving order) and `translateLine(line, prev)` (AI SDK
  `generateText` wrapper with the English-translation system prompt; previous line
  passed as light context for lyric coherence).

## Data flow

input text → `splitLines()` → sequential `for` loop → per content line: `translateLine()`
→ stream `{type:"line", index, original, translation}` → client appends → final
`{type:"done"}`. Blank lines stream `{type:"line", index, original:"", translation:""}`
to preserve stanza breaks.

## NDJSON event shapes

- `{type:"line", index, original, translation}` — a translated (or blank) line.
- `{type:"error", index, original, message}` — that line failed; loop continues.
- `{type:"done", count}` — stream complete.

## Error handling

- A failed line emits an `error` event and the loop continues — one bad line never
  kills the job. UI shows the original marked "⚠ untranslated".
- Empty input rejected client-side (button disabled) and server-side (400).
- Missing `AI_GATEWAY_API_KEY` → server emits a single clear `error` event.

## Testing

- Unit tests (vitest) for `splitLines`: blank-line preservation, ordering, trailing
  newline handling, CRLF.
- `translateLine` tested with the AI SDK mocked so CI burns no tokens.

## Non-goals (YAGNI)

- No target language other than English.
- No persistence / history.
- No parallel translation (explicitly sequential per request).
