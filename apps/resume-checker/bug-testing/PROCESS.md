# Bug-Testing Process

This folder exists so the audit workflow is explicit and repeatable instead of informal.

## Scope

- Static site root: `index.html`
- Runtime assets: `assets/`
- Audit runner: `bug-testing/run-audit.mjs`
- Reports: `bug-testing/reports/`
- Screenshots: `bug-testing/screenshots/`
- Logs: `bug-testing/logs/`

## Fixed Workflow

1. Start from the current local build.
2. Load the bundled sample PDF (`assets/resume-sample.pdf`) into the upload flow.
3. For each design group:
4. For each option inside that group:
5. Navigate through Landing, Upload, About, Banks, and Results.
6. Capture a screenshot for each page.
7. Verify that the intended selectors changed and that the page still renders correctly.
8. Write the iteration report to `bug-testing/reports/iteration-XX.md`.
9. If errors exist, fix the site, rerun the audit, and write a new report.
10. Repeat until five full iterations are complete.

## Required Checks

- Each design group must expose exactly 12 options.
- The upload flow must accept the bundled PDF.
- Heading font, accent font, body font, mono font, backdrop, surface tone, text palette, corner profile, CTA system, hero treatment, accent metal, and frame treatment must all be verifiable.
- Each option must produce page screenshots for:
  - Landing
  - Upload
  - About
  - Banks
  - Results
- Reports must include:
  - exact iteration number
  - pass count
  - error count
  - grouped findings
  - screenshot directory
  - next action

## Commands

- Install tooling: `npm install`
- Browser dependency: `npx playwright install chromium`
- Single audit pass: `npm run audit:1`
- Five audit passes: `npm run audit:5`

## Output Convention

- Iteration report: `bug-testing/reports/iteration-01.md`
- Iteration JSON log: `bug-testing/logs/iteration-01.json`
- Iteration screenshots: `bug-testing/screenshots/iteration-01/...`
- Latest summary: `bug-testing/reports/LATEST_SUMMARY.md`
