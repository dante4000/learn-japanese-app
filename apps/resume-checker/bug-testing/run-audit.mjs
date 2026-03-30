import { createReadStream, existsSync } from "node:fs";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const PORT = 4173;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const ITERATIONS = Number(process.env.ITERATIONS || 5);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".pdf": "application/pdf",
  ".md": "text/markdown; charset=utf-8",
};

const PAGE_SELECTORS = {
  landing: {
    id: "page-landing",
    section: "#page-landing .page-shell",
    heading: '[data-testid="landing-hero-primary"]',
    accent: '[data-testid="landing-hero-accent"]',
    body: '[data-testid="landing-description"]',
    mono: '[data-testid="landing-stat-1"]',
    cta: "#page-landing .button-primary",
    surface: "#page-landing .invite-card",
    corner: "#page-landing .invite-card",
  },
  upload: {
    id: "page-upload",
    section: "#page-upload .page-shell",
    heading: '[data-testid="upload-title"]',
    accent: '[data-testid="upload-heading-accent"]',
    body: '[data-testid="upload-description"]',
    mono: '[data-testid="upload-file-name"]',
    cta: "#page-upload .button-primary",
    surface: '[data-testid="resume-stage"]',
    corner: '[data-testid="resume-stage"]',
  },
  about: {
    id: "page-about",
    section: "#page-about .page-shell",
    heading: '[data-testid="about-title"]',
    accent: '[data-testid="about-heading-accent"]',
    body: '[data-testid="about-description"]',
    mono: '[data-testid="about-mono"]',
    cta: "#page-about .button-primary",
    surface: "#page-about .context-note",
    corner: "#page-about .context-note",
  },
  banks: {
    id: "page-banks",
    section: "#page-banks .page-shell",
    heading: '[data-testid="banks-title"]',
    accent: '[data-testid="banks-heading-accent"]',
    body: '[data-testid="banks-description"]',
    mono: '[data-testid="banks-mono"]',
    cta: "#page-banks .button-primary",
    surface: "#page-banks .upload-meta",
    corner: "#page-banks .upload-meta",
  },
  results: {
    id: "page-results",
    section: "#page-results .page-shell",
    heading: '[data-testid="results-title"]',
    accent: '[data-testid="results-heading-accent"]',
    body: '[data-testid="results-description"]',
    mono: '[data-testid="results-score"]',
    cta: "#page-results .button-primary",
    surface: '[data-testid="results-score-panel"]',
    corner: '[data-testid="results-score-panel"]',
  },
};

const RULES = {
  "heading-font": ({ pageKey }) => [
    { selector: PAGE_SELECTORS[pageKey].heading, property: "fontFamily", rootVar: "--font-heading", kind: "font" },
  ],
  "accent-font": ({ pageKey }) => [
    { selector: PAGE_SELECTORS[pageKey].accent, property: "fontFamily", rootVar: "--font-accent", kind: "font" },
  ],
  "body-font": ({ pageKey }) => [
    { selector: PAGE_SELECTORS[pageKey].body, property: "fontFamily", rootVar: "--font-body", kind: "font" },
  ],
  "stat-numbers": ({ pageKey }) => [
    { selector: PAGE_SELECTORS[pageKey].mono, property: "fontFamily", rootVar: "--font-mono", kind: "font" },
  ],
  "page-background": () => [
    { selector: "body", property: "backgroundColor", rootVar: "--page-bg", kind: "color" },
  ],
  "form-card-bg": ({ pageKey }) => [
    { selector: PAGE_SELECTORS[pageKey].surface, property: "backgroundColor", rootVar: "--surface-1", kind: "color" },
  ],
  "text-color-palette": ({ pageKey }) => [
    { selector: PAGE_SELECTORS[pageKey].heading, property: "color", rootVar: "--ink-1", kind: "color" },
    { selector: PAGE_SELECTORS[pageKey].body, property: "color", rootVar: "--ink-2", kind: "color" },
  ],
  "border-radius": ({ pageKey }) => [
    { selector: PAGE_SELECTORS[pageKey].corner, property: "borderRadius", rootVar: "--radius-lg", kind: "radius" },
  ],
  "cta-button": ({ pageKey }) => [
    { selector: PAGE_SELECTORS[pageKey].cta, property: "borderRadius", rootVar: "--button-radius", kind: "radius" },
    { selector: PAGE_SELECTORS[pageKey].cta, property: "textTransform", rootVar: "--button-transform", kind: "exact" },
    { selector: PAGE_SELECTORS[pageKey].cta, property: "backgroundColor", rootVar: "--button-bg", kind: "color" },
  ],
  "gold-accent": ({ pageKey }) => [
    { selector: PAGE_SELECTORS[pageKey].accent, property: "color", rootVar: "--accent", kind: "color" },
  ],
  "bank-ticker": ({ pageKey }) =>
    pageKey === "landing"
      ? [
          { selector: '[data-testid="landing-market-ribbon"]', property: "fontSize", rootVar: "--ticker-size", kind: "exact" },
          { selector: '[data-testid="landing-market-ribbon"]', property: "textTransform", rootVar: "--ticker-transform", kind: "exact" },
        ]
      : [],
  "score-display": ({ pageKey }) =>
    pageKey === "results"
      ? [
          { selector: '[data-testid="results-score"]', property: "fontSize", rootVar: "--score-number-size", kind: "exact" },
        ]
      : [],
  "severity-badges": ({ pageKey }) =>
    pageKey === "results"
      ? [
          { selector: "#page-results .status-pill", property: "textTransform", rootVar: "--badge-transform", kind: "exact" },
          { selector: "#page-results .status-pill", property: "borderRadius", rootVar: "--badge-radius", kind: "radius" },
        ]
      : [],
  "progress-bars": ({ pageKey }) =>
    pageKey === "results"
      ? [
          { selector: "#page-results .metric-track", property: "height", rootVar: "--progress-height", kind: "exact" },
          { selector: "#page-results .metric-track", property: "borderRadius", rootVar: "--progress-radius", kind: "radius" },
        ]
      : [],
  "issue-cards": ({ pageKey }) =>
    pageKey === "results"
      ? [
          { selector: '[data-testid="issue-card-critical"]', property: "borderRadius", rootVar: "--issue-radius", kind: "radius" },
        ]
      : [],
  "rewrite-cards": ({ pageKey }) =>
    pageKey === "results"
      ? [
          { selector: "#page-results .rewrite-card", property: "borderRadius", rootVar: "--rewrite-radius", kind: "radius" },
        ]
      : [],
  "bank-fit": ({ pageKey }) =>
    pageKey === "results"
      ? [
          { selector: "#page-results .fit-row", property: "fontSize", rootVar: "--fit-label-size", kind: "exact" },
        ]
      : [],
  "section-headers": ({ pageKey }) =>
    pageKey === "results"
      ? [
          { selector: "#page-results .panel-title", property: "fontWeight", rootVar: "--section-weight", kind: "exact" },
        ]
      : pageKey === "landing"
        ? [
            { selector: "#page-landing .section-heading", property: "fontWeight", rootVar: "--section-weight", kind: "exact" },
          ]
        : [],
  "top-nav": () => [
    { selector: '[data-testid="shell-bar"]', property: "borderRadius", rootVar: "--frame-shell-radius", kind: "radius" },
    { selector: ".page-tab.is-active", property: "textTransform", rootVar: "--frame-tab-transform", kind: "exact" },
    { selector: ".page-tab.is-active", property: "borderRadius", rootVar: "--frame-tab-radius", kind: "radius" },
  ],
};

function getContentType(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

function startServer(rootDir, port) {
  const server = http.createServer(async (req, res) => {
    try {
      const requestPath = req.url === "/" ? "/index.html" : decodeURIComponent(req.url.split("?")[0]);
      const filePath = path.join(rootDir, requestPath);
      const safePath = path.normalize(filePath);

      if (!safePath.startsWith(rootDir)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      let target = safePath;
      if (!existsSync(target)) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      const stat = await fs.stat(target);
      if (stat.isDirectory()) {
        target = path.join(target, "index.html");
      }

      res.writeHead(200, { "Content-Type": getContentType(target) });
      createReadStream(target).pipe(res);
    } catch (error) {
      res.writeHead(500);
      res.end(String(error));
    }
  });

  return new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

function normalizeFontFamily(value) {
  return value
    .split(",")[0]
    .replace(/["']/g, "")
    .trim()
    .toLowerCase();
}

function normalizeRadius(value) {
  return value.split(" ")[0].trim();
}

async function compareStyle(page, { selector, property, rootVar, kind }) {
  return page.evaluate(({ selector, property, rootVar, kind }) => {
    const toCssProperty = (value) => value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
    const element = selector === "body" ? document.body : document.querySelector(selector);
    if (!element) {
      return {
        ok: false,
        selector,
        property,
        reason: "selector-missing",
        actual: null,
        expected: null,
      };
    }

    const actual = getComputedStyle(element)[property];
    let expected = "";

    if (rootVar) {
      const probe = document.createElement("div");
      probe.style.position = "absolute";
      probe.style.visibility = "hidden";
      probe.style.pointerEvents = "none";
      probe.style.setProperty(toCssProperty(property), `var(${rootVar})`);
      document.body.appendChild(probe);
      expected = getComputedStyle(probe)[property];
      probe.remove();
    }

    const normalizeFont = (value) => value.split(",")[0].replace(/["']/g, "").trim().toLowerCase();
    const normalizeRadiusValue = (value) => value.split(" ")[0].trim();
    const normalizeColor = (value) => value.replace(/\s+/g, "").toLowerCase();

    let ok = false;
    if (kind === "font") {
      ok = normalizeFont(actual).includes(normalizeFont(expected));
    } else if (kind === "color") {
      ok = normalizeColor(actual) === normalizeColor(expected);
    } else if (kind === "radius") {
      ok = normalizeRadiusValue(actual) === normalizeRadiusValue(expected);
    } else {
      ok = actual === expected;
    }

    return {
      ok,
      selector,
      property,
      actual,
      expected,
      reason: ok ? "match" : "mismatch",
    };
  }, { selector, property, rootVar, kind });
}

async function seedUiState(page) {
  await page.evaluate(() => {
    window.__designLab.setSampleResume();
    document.getElementById("candidate-name").value = "Avery Jordan";
    document.getElementById("candidate-school").value = "Wharton";
    document.getElementById("candidate-cycle").value = "2027 Summer Analyst";
    document.getElementById("candidate-name").dispatchEvent(new Event("input", { bubbles: true }));
    document.getElementById("candidate-school").dispatchEvent(new Event("input", { bubbles: true }));
    document.getElementById("candidate-cycle").dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function reportHeader(iteration, stats, screenshotDir) {
  return [
    `# Iteration ${iteration.toString().padStart(2, "0")} Audit Report`,
    "",
    `- Date: ${new Date().toISOString()}`,
    `- Assertions: ${stats.assertions}`,
    `- Passed: ${stats.passed}`,
    `- Errors: ${stats.errors.length}`,
    `- Screenshot directory: \`${screenshotDir}\``,
    "",
  ].join("\n");
}

function reportBody(stats) {
  if (!stats.errors.length) {
    return [
      "## Status",
      "",
      "Pass. No propagation or rendering mismatches detected in this iteration.",
      "",
      "## Next Action",
      "",
      "Run the next iteration without changing the build so the audit history stays explicit.",
      "",
    ].join("\n");
  }

  const grouped = new Map();
  for (const error of stats.errors) {
    const key = `${error.group} / ${error.option} / ${error.page}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(error);
  }

  const blocks = [...grouped.entries()].map(([key, errors]) => {
    const lines = errors.map(
      (error) =>
        `- \`${error.selector}\` ${error.property}: expected \`${error.expected}\`, got \`${error.actual}\``
    );
    return [`### ${key}`, "", ...lines, ""].join("\n");
  });

  return [
    "## Status",
    "",
    "Failures detected. Fixes are required before the next clean sign-off.",
    "",
    "## Findings",
    "",
    ...blocks,
    "## Next Action",
    "",
    "Fix the mismatches above, rerun the audit, and preserve the next report as a separate iteration file.",
    "",
  ].join("\n");
}

async function capturePage(page, pageKey, outputPath) {
  const locator = page.locator(PAGE_SELECTORS[pageKey].section);
  await locator.screenshot({ path: outputPath, type: "jpeg", quality: 60 });
}

async function runIteration(iteration) {
  const iterationId = `iteration-${String(iteration).padStart(2, "0")}`;
  const screenshotDir = path.join(ROOT, "bug-testing", "screenshots", iterationId);
  const reportPath = path.join(ROOT, "bug-testing", "reports", `${iterationId}.md`);
  const logPath = path.join(ROOT, "bug-testing", "logs", `${iterationId}.json`);
  await ensureDir(screenshotDir);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1512, height: 1100 } });
  const stats = {
    iteration,
    assertions: 0,
    passed: 0,
    errors: [],
  };

  page.on("console", (message) => {
    if (message.type() === "error") {
      stats.errors.push({
        group: "runtime",
        option: "console",
        page: "global",
        selector: "console",
        property: "message",
        expected: "no errors",
        actual: message.text(),
      });
    }
  });

  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await seedUiState(page);

  const groups = await page.evaluate(() => window.__designLab.groups);
  stats.assertions += 1;
  if (groups.length !== 19) {
    stats.errors.push({
      group: "structure",
      option: "groups",
      page: "global",
      selector: "window.__designLab.groups",
      property: "length",
      expected: "19",
      actual: String(groups.length),
    });
  } else {
    stats.passed += 1;
  }

  for (const group of groups) {
    stats.assertions += 1;
    if (group.options.length !== 12) {
      stats.errors.push({
        group: group.id,
        option: "option-count",
        page: "global",
        selector: group.id,
        property: "options.length",
        expected: "12",
        actual: String(group.options.length),
      });
    } else {
      stats.passed += 1;
    }
  }

  for (const group of groups) {
    for (const option of group.options) {
      await page.evaluate(() => window.__designLab.activatePage("page-lab"));
      await page.locator(`[data-testid="option-${group.id}-${option.id}"]`).click();
      await page.waitForTimeout(40);

      for (const [pageKey, pageConfig] of Object.entries(PAGE_SELECTORS)) {
        await page.evaluate((target) => window.__designLab.activatePage(target), pageConfig.id);
        await page.waitForTimeout(30);

        const targetDir = path.join(screenshotDir, group.id, option.id);
        await ensureDir(targetDir);
        await capturePage(page, pageKey, path.join(targetDir, `${pageKey}.jpg`));

        for (const rule of RULES[group.id]({ pageKey })) {
          const result = await compareStyle(page, rule);
          stats.assertions += 1;
          if (result.ok) {
            stats.passed += 1;
          } else {
            stats.errors.push({
              group: group.id,
              option: option.label,
              page: pageKey,
              selector: result.selector,
              property: result.property,
              expected: result.expected,
              actual: result.actual,
            });
          }
        }
      }
    }
  }

  await browser.close();

  const report = `${reportHeader(iteration, stats, path.relative(ROOT, screenshotDir))}${reportBody(stats)}`;
  await fs.writeFile(reportPath, report, "utf8");
  await fs.writeFile(logPath, JSON.stringify(stats, null, 2), "utf8");
  return { reportPath, stats };
}

async function writeLatestSummary(results) {
  const summaryPath = path.join(ROOT, "bug-testing", "reports", "LATEST_SUMMARY.md");
  const rows = results.map(
    ({ stats }) =>
      `| ${String(stats.iteration).padStart(2, "0")} | ${stats.assertions} | ${stats.passed} | ${stats.errors.length} |`
  );
  const content = [
    "# Latest Audit Summary",
    "",
    "| Iteration | Assertions | Passed | Errors |",
    "| --- | ---: | ---: | ---: |",
    ...rows,
    "",
  ].join("\n");
  await fs.writeFile(summaryPath, content, "utf8");
}

async function main() {
  await ensureDir(path.join(ROOT, "bug-testing", "reports"));
  await ensureDir(path.join(ROOT, "bug-testing", "logs"));
  await ensureDir(path.join(ROOT, "bug-testing", "screenshots"));

  const server = await startServer(ROOT, PORT);
  const results = [];

  try {
    for (let iteration = 1; iteration <= ITERATIONS; iteration += 1) {
      results.push(await runIteration(iteration));
    }
    await writeLatestSummary(results);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }

  const totalErrors = results.reduce((sum, result) => sum + result.stats.errors.length, 0);
  if (totalErrors > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
