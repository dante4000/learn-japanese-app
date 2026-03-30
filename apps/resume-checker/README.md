# IB Resume Bench

Static HTML/CSS/JS prototype for an investment-banking resume benchmark flow and design lab.

## Local

```bash
npm install
npx playwright install chromium
npm run dev
```

Open `http://127.0.0.1:4173`.

## Audit

Single pass:

```bash
npm run audit:1
```

Five-pass sequence:

```bash
npm run audit:5
```

Artifacts are written to `bug-testing/`.

## Deploy

The site is deployable as a static project.

- Entry file: `index.html`
- Runtime assets: `assets/`
- Vercel config: `vercel.json`
- Vercel exclusions: `.vercelignore`

For Vercel, point the project root at this directory and deploy normally.
