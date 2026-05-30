# Learn Japanese

A browser-based Japanese trainer for kana, kanji, and vocabulary review.

## Features

- Hiragana and katakana typing drills with row selection, alternate romaji, stroke-order links, and local scoring.
- Kanji practice using a top-1000 kanji deck with meaning/reading prompts.
- Vocabulary flashcards with an Anki-style scheduler and Vercel Blob sync.
- PIN-protected progress storage with local cache fallback and account deletion.
- Light/dark themes, mobile-first layouts, lazy-loaded vocabulary data, and optional Japanese webfont previews.

## Local Development

```sh
npm install
vercel dev
```

The `/api/state` endpoint needs the Vercel Blob environment variables from the linked project. Use `vercel pull --environment production` or `vercel pull --environment preview` to populate local Vercel env files.

## Checks

```sh
npm run validate
npm test
npm run test:e2e
node tests/audit.mjs
```

`npm run test:e2e` and `tests/audit.mjs` expect `vercel dev` to be running on `http://localhost:3000` unless `BASE` is set.

## Deploy

```sh
vercel deploy --prod
```
