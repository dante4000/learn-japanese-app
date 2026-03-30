const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const styleString = (tokens = {}) =>
  Object.entries(tokens)
    .map(([key, val]) => `${key}: ${val}`)
    .join("; ");

const CTA_PREVIEW_BASE_TOKENS = {
  "--accent": "#c49e57",
  "--accent-soft": "rgba(196, 158, 87, 0.15)",
  "--accent-contrast": "#110c07",
  "--ink-1": "#efe8dc",
  "--ink-2": "#b6ad9f",
  "--surface-border": "rgba(239, 232, 220, 0.08)",
  "--surface-3": "#221d18",
  "--radius-xs": "2px",
  "--radius-sm": "4px",
  "--radius-pill": "999px",
};

const renderStaticCtaPreview = (option) => `
  <div class="cta-preview-frame" style="${styleString({ ...CTA_PREVIEW_BASE_TOKENS, ...option.tokens })}">
    <div class="cta-preview-stack">
      <span class="cta-preview-button cta-preview-button--primary">
        <span>Review Bench</span>
        <span class="cta-preview-arrow">↗</span>
      </span>
      <span class="cta-preview-button cta-preview-button--secondary">Open Lab</span>
    </div>
  </div>
`;

const TICKER_PREVIEW_BASE_TOKENS = {
  "--accent": "#c49e57",
  "--ink-1": "#efe8dc",
  "--ink-2": "#b6ad9f",
  "--ink-3": "#7f7467",
  "--ticker-color": "#7f7467",
  "--ticker-size": "0.72rem",
  "--ticker-spacing": "0.14em",
  "--ticker-transform": "uppercase",
  "--ticker-gap": "1.3rem",
  "--ticker-border": "1px solid rgba(239, 232, 220, 0.08)",
  "--ticker-shell-bg": "transparent",
  "--ticker-shell-border": "0 solid transparent",
  "--ticker-shell-radius": "0px",
  "--ticker-shell-shadow": "none",
  "--ticker-shell-padding-block": "0.2rem",
  "--ticker-shell-padding-inline": "0",
  "--ticker-justify": "flex-start",
  "--ticker-item-bg": "transparent",
  "--ticker-item-border": "0 solid transparent",
  "--ticker-item-radius": "0px",
  "--ticker-item-padding-block": "0",
  "--ticker-item-padding-inline": "0",
  "--ticker-item-shadow": "none",
  "--ticker-item-color": "var(--ticker-color)",
  "--ticker-item-weight": "500",
  "--ticker-item-gap": "0",
  "--ticker-item-dot-display": "none",
  "--ticker-item-dot-size": "0.34rem",
  "--ticker-item-dot-color": "var(--accent)",
};

const renderTickerPreview = (option) => `
  <div class="ticker-preview-frame" style="${styleString({ ...TICKER_PREVIEW_BASE_TOKENS, ...option.tokens })}">
    <div class="market-ribbon">
      <span>GS</span>
      <span>MS</span>
      <span>EVR</span>
      <span>PJT</span>
    </div>
  </div>
`;

const RESULTS_PREVIEW_BASE_TOKENS = {
  "--accent": "#c49e57",
  "--accent-soft": "rgba(196, 158, 87, 0.15)",
  "--accent-contrast": "#110c07",
  "--warning": "#d1a35e",
  "--danger": "#cf725e",
  "--success": "#7eb08d",
  "--page-bg": "#090806",
  "--surface-1": "rgba(20, 17, 14, 0.86)",
  "--surface-border": "rgba(239, 232, 220, 0.08)",
  "--ink-1": "#efe8dc",
  "--ink-2": "#b6ad9f",
  "--ink-3": "#7f7467",
  "--font-body": "'IBM Plex Sans', sans-serif",
  "--font-mono": "'JetBrains Mono', monospace",
  "--radius-xs": "2px",
  "--radius-sm": "4px",
  "--radius-md": "8px",
  "--radius-lg": "14px",
  "--radius-pill": "999px",
  "--score-ring-accent": "#c49e57",
  "--score-ring-track": "rgba(255, 255, 255, 0.08)",
  "--score-ring-fill": "conic-gradient(var(--score-ring-accent) 0 87%, var(--score-ring-track) 87% 100%)",
  "--score-ring-size": "96px",
  "--score-ring-radius": "50%",
  "--score-ring-inner-size": "73%",
  "--score-ring-inner-radius": "50%",
  "--score-ring-border": "0 solid transparent",
  "--score-ring-shadow": "none",
  "--score-ring-sheen": "none",
  "--score-ring-transform": "none",
  "--score-ring-inner-bg": "#090806",
  "--score-ring-inner-border": "0 solid transparent",
  "--score-stack-gap": "0.15rem",
  "--score-number-size": "2rem",
  "--score-number-weight": "500",
  "--score-number-color": "#efe8dc",
  "--score-number-spacing": "-0.04em",
  "--score-label-size": "0.62rem",
  "--score-label-weight": "600",
  "--score-label-spacing": "0.12em",
  "--score-label-transform": "uppercase",
  "--score-label-color": "#7f7467",
  "--score-label-bg": "transparent",
  "--score-label-border": "0 solid transparent",
  "--score-label-radius": "999px",
  "--score-label-padding": "0",
  "--score-panel-columns": "minmax(0, 1fr)",
  "--score-panel-gap": "0.6rem",
  "--score-panel-align": "stretch",
  "--score-panel-bg-layer": "none",
  "--score-panel-shadow": "none",
  "--score-ring-margin": "0 auto 0.55rem",
  "--score-ring-justify-self": "center",
  "--score-breakdown-bg": "transparent",
  "--score-breakdown-border": "0 solid transparent",
  "--score-breakdown-radius": "0px",
  "--score-breakdown-padding": "0",
  "--score-breakdown-shadow": "none",
  "--score-actions-justify": "flex-start",
  "--score-actions-padding-top": "0",
  "--badge-radius": "999px",
  "--badge-size": "0.6rem",
  "--badge-weight": "600",
  "--badge-spacing": "0.08em",
  "--badge-transform": "uppercase",
  "--badge-padding-block": "0.24rem",
  "--badge-padding-inline": "0.48rem",
  "--badge-gap": "0rem",
  "--badge-shadow": "none",
  "--badge-dot-display": "none",
  "--badge-dot-size": "0.38rem",
  "--badge-danger-bg": "rgba(207, 114, 94, 0.14)",
  "--badge-danger-border": "rgba(207, 114, 94, 0.28)",
  "--badge-danger-color": "#cf725e",
  "--badge-warning-bg": "rgba(209, 163, 94, 0.14)",
  "--badge-warning-border": "rgba(209, 163, 94, 0.28)",
  "--badge-warning-color": "#d1a35e",
  "--badge-success-bg": "rgba(126, 176, 141, 0.14)",
  "--badge-success-border": "rgba(126, 176, 141, 0.28)",
  "--badge-success-color": "#7eb08d",
  "--progress-height": "0.35rem",
  "--progress-radius": "999px",
  "--progress-track-bg": "rgba(255, 255, 255, 0.08)",
  "--progress-track-border": "0 solid transparent",
  "--progress-track-shadow": "none",
  "--progress-fill-shadow": "none",
  "--progress-success-fill": "#7eb08d",
  "--progress-warning-fill": "#d1a35e",
  "--progress-label-size": "0.72rem",
  "--progress-label-weight": "500",
  "--progress-value-size": "0.78rem",
  "--progress-value-weight": "600",
  "--progress-row-gap": "0.45rem",
  "--issue-bg": "rgba(255, 255, 255, 0.02)",
  "--issue-radius": "8px",
  "--issue-padding": "0.7rem",
  "--issue-gap": "0.45rem",
  "--issue-card-shadow": "none",
  "--issue-title-size": "0.84rem",
  "--issue-title-weight": "600",
  "--issue-title-spacing": "-0.01em",
  "--issue-title-transform": "none",
  "--issue-rail-width": "0px",
  "--issue-border-critical": "rgba(207, 114, 94, 0.32)",
  "--issue-border-warning": "rgba(209, 163, 94, 0.35)",
  "--issue-critical-bg": "rgba(255, 255, 255, 0.02)",
  "--issue-warning-bg": "rgba(255, 255, 255, 0.02)",
  "--rewrite-radius": "4px",
  "--rewrite-gap": "0.4rem",
  "--rewrite-padding": "0.6rem",
  "--rewrite-min-height": "86px",
  "--rewrite-card-shadow": "none",
  "--rewrite-before-bg": "rgba(129, 70, 62, 0.18)",
  "--rewrite-after-bg": "rgba(56, 92, 72, 0.22)",
  "--rewrite-before-border": "1px solid rgba(207, 114, 94, 0.24)",
  "--rewrite-after-border": "1px solid rgba(126, 176, 141, 0.26)",
  "--rewrite-before-accent": "#cf8c7b",
  "--rewrite-after-accent": "#8fc19d",
  "--rewrite-before-shadow": "inset 3px 0 0 rgba(207, 114, 94, 0.52)",
  "--rewrite-after-shadow": "inset 3px 0 0 rgba(126, 176, 141, 0.5)",
  "--rewrite-label-color": "#7f7467",
  "--rewrite-label-bg": "transparent",
  "--rewrite-label-border": "0 solid transparent",
  "--rewrite-label-radius": "999px",
  "--rewrite-label-padding": "0",
  "--rewrite-label-size": "0.58rem",
  "--rewrite-label-spacing": "0.12em",
  "--rewrite-label-transform": "uppercase",
  "--rewrite-before-label-color": "#cf8c7b",
  "--rewrite-after-label-color": "#8fc19d",
  "--rewrite-before-label-bg": "rgba(207, 114, 94, 0.1)",
  "--rewrite-after-label-bg": "rgba(126, 176, 141, 0.1)",
  "--rewrite-before-label-border": "1px solid rgba(207, 114, 94, 0.18)",
  "--rewrite-after-label-border": "1px solid rgba(126, 176, 141, 0.2)",
  "--rewrite-before-text": "#efe8dc",
  "--rewrite-after-text": "#efe8dc",
  "--rewrite-before-offset": "0px",
  "--rewrite-after-offset": "0px",
  "--fit-row-gap": "0.42rem",
  "--fit-label-size": "0.74rem",
  "--fit-label-weight": "500",
  "--fit-row-padding-block": "0.4rem",
  "--fit-row-padding-inline": "0",
  "--fit-row-radius": "0px",
  "--fit-row-bg": "transparent",
  "--fit-row-shadow": "none",
  "--fit-row-divider-style": "solid",
  "--fit-row-divider-color": "rgba(255, 255, 255, 0.06)",
  "--fit-row-direction": "row",
  "--fit-row-align": "center",
  "--fit-row-justify": "space-between",
  "--fit-name-transform": "none",
  "--fit-name-spacing": "0em",
  "--fit-name-color": "#efe8dc",
};

const renderResultsPreviewFrame = (tokens, innerHtml) => `
  <div class="results-preview-frame" style="${styleString({ ...RESULTS_PREVIEW_BASE_TOKENS, ...tokens })}">
    ${innerHtml}
  </div>
`;

const renderScorePreview = (option) =>
  renderResultsPreviewFrame(
    option.tokens,
    `
      <div class="score-panel score-panel--preview">
        <div class="score-summary-main">
          <div class="score-ring">
            <div class="score-ring-inner">
              <span class="score-number stat-value">87</span>
              <span class="score-label">overall</span>
            </div>
          </div>
          <div class="score-summary-copy">
            <span class="status-pill status-pill--warning">Needs fixes</span>
            <h3 class="results-summary-title">Resume benchmark looks unfinished.</h3>
            <p class="page-copy results-summary-copy-text">The score panel has to feel like the product, not a generic stats widget.</p>
          </div>
        </div>
        <div class="score-breakdown score-breakdown--compact preview-metric-list">
          <div class="summary-pillar preview-metric-row">
            <span class="metric-label">Format</span>
            <div class="metric-track"><div class="metric-fill metric-fill--success" style="width: 88%"></div></div>
            <span class="metric-value stat-value">12/15</span>
          </div>
          <div class="summary-pillar preview-metric-row">
            <span class="metric-label">Bullets</span>
            <div class="metric-track"><div class="metric-fill metric-fill--warning" style="width: 78%"></div></div>
            <span class="metric-value stat-value">15/25</span>
          </div>
          <div class="summary-pillar preview-metric-row">
            <span class="metric-label">Fit</span>
            <div class="metric-track"><div class="metric-fill metric-fill--success" style="width: 84%"></div></div>
            <span class="metric-value stat-value">13/15</span>
          </div>
        </div>
      </div>
    `
  );

const renderBadgePreview = (option) =>
  renderResultsPreviewFrame(
    option.tokens,
    `
      <div class="preview-status-stack">
        <span class="status-pill status-pill--danger">Critical</span>
        <span class="status-pill status-pill--warning">Moderate</span>
        <span class="status-pill status-pill--success">Strong Match</span>
      </div>
    `
  );

const renderProgressPreview = (option) =>
  renderResultsPreviewFrame(
    option.tokens,
    `
      <div class="preview-metric-list">
        <div class="preview-metric-row">
          <span class="metric-label">Formatting</span>
          <div class="metric-track"><div class="metric-fill metric-fill--success" style="width: 91%"></div></div>
          <span class="metric-value stat-value">91</span>
        </div>
        <div class="preview-metric-row">
          <span class="metric-label">Specificity</span>
          <div class="metric-track"><div class="metric-fill metric-fill--warning" style="width: 72%"></div></div>
          <span class="metric-value stat-value">72</span>
        </div>
      </div>
    `
  );

const renderIssuePreview = (option) =>
  renderResultsPreviewFrame(
    option.tokens,
    `
      <div class="preview-issue-stack">
        <article class="issue-card">
          <span class="status-pill status-pill--danger">Critical</span>
          <h3 class="issue-title">Ownership is too soft.</h3>
          <p class="page-copy">Lead with execution, not support verbs.</p>
        </article>
        <article class="issue-card issue-card--warning">
          <span class="status-pill status-pill--warning">Moderate</span>
          <h3 class="issue-title">Outcome still feels implied.</h3>
        </article>
      </div>
    `
  );

const renderRewritePreview = (option) =>
  renderResultsPreviewFrame(
    option.tokens,
    `
      <div class="preview-rewrite-stack">
        <div class="rewrite-grid">
          <div class="rewrite-card rewrite-card--before">
            <p class="rewrite-label">Before</p>
            <p>Supported valuation workstreams.</p>
          </div>
          <div class="rewrite-card rewrite-card--after">
            <p class="rewrite-label">After</p>
            <p>Built weekly valuation packs for live deals.</p>
          </div>
        </div>
      </div>
    `
  );

const renderBankFitPreview = (option) =>
  renderResultsPreviewFrame(
    option.tokens,
    `
      <div class="preview-fit-stack fit-list">
        <div class="fit-row">
          <span>Goldman Sachs</span>
          <span class="status-pill status-pill--success">Strong</span>
        </div>
        <div class="fit-row">
          <span>Morgan Stanley</span>
          <span class="status-pill status-pill--warning">Moderate</span>
        </div>
      </div>
    `
  );

const buildFontGroup = ({ id, title, description, cssVar, sample, options }) => ({
  id,
  title,
  description,
  renderPreview: (option) => `
    <div class="font-preview" style="font-family:${option.previewValue}">
      <strong>${escapeHtml(sample)}</strong>
      <span>${escapeHtml(option.note)}</span>
    </div>
  `,
  options: options.map((option) => ({
    id: slugify(option.label),
    label: option.label,
    note: option.note,
    previewValue: option.value,
    tokens: {
      [cssVar]: option.value,
    },
    meta: option.value,
  })),
});

const buildTokenGroup = ({ id, title, description, options, renderPreview }) => ({
  id,
  title,
  description,
  renderPreview,
  options: options.map((option) => ({
    id: slugify(option.label),
    label: option.label,
    note: option.note,
    tokens: option.tokens,
    meta: option.meta,
  })),
});

const fontGroups = [
  buildFontGroup({
    id: "heading-font",
    title: "1. Heading Font",
    description: "Controls every primary title across the site, not just the landing hero.",
    cssVar: "--font-heading",
    sample: "Resume Benchmark",
    options: [
      { label: "Newsreader", value: "'Newsreader', serif", note: "Editorial serif" },
      { label: "Cormorant Garamond", value: "'Cormorant Garamond', serif", note: "Elegant and lean" },
      { label: "IBM Plex Sans", value: "'IBM Plex Sans', sans-serif", note: "Terminal-adjacent sans" },
      { label: "Fraunces", value: "'Fraunces', serif", note: "Soft high-contrast serif" },
      { label: "Instrument Serif", value: "'Instrument Serif', serif", note: "Sharp italic-friendly serif" },
      { label: "Libre Baskerville", value: "'Libre Baskerville', serif", note: "Classic memo serif" },
      { label: "Spectral", value: "'Spectral', serif", note: "Newsroom texture" },
      { label: "DM Serif Display", value: "'DM Serif Display', serif", note: "Display-led" },
      { label: "EB Garamond", value: "'EB Garamond', serif", note: "Bookish and restrained" },
      { label: "Space Grotesk", value: "'Space Grotesk', sans-serif", note: "Harder modern contrast" },
      { label: "Manrope", value: "'Manrope', sans-serif", note: "Quiet geometric sans" },
      { label: "Plus Jakarta Sans", value: "'Plus Jakarta Sans', sans-serif", note: "Crisp UI-forward sans" },
    ],
  }),
  buildFontGroup({
    id: "accent-font",
    title: "2. Accent Font",
    description: "Shapes the contrast line, italic notes, and highlighted phrases across pages.",
    cssVar: "--font-accent",
    sample: "for Banking",
    options: [
      { label: "Cormorant Garamond", value: "'Cormorant Garamond', serif", note: "Default editorial italic" },
      { label: "Newsreader", value: "'Newsreader', serif", note: "Quiet magazine accent" },
      { label: "Instrument Serif", value: "'Instrument Serif', serif", note: "Softer but deliberate" },
      { label: "Fraunces", value: "'Fraunces', serif", note: "Heavy character and curve" },
      { label: "DM Serif Display", value: "'DM Serif Display', serif", note: "Theatrical but compact" },
      { label: "Playfair Display", value: "'Playfair Display', serif", note: "Classic high contrast" },
      { label: "Lora", value: "'Lora', serif", note: "Readable serif accent" },
      { label: "Spectral", value: "'Spectral', serif", note: "Newspaper cadence" },
      { label: "Libre Baskerville", value: "'Libre Baskerville', serif", note: "Conservative serif accent" },
      { label: "Space Grotesk", value: "'Space Grotesk', sans-serif", note: "No script switch at all" },
      { label: "Sora", value: "'Sora', sans-serif", note: "Rounder modern accent" },
      { label: "Manrope", value: "'Manrope', sans-serif", note: "Weight shift instead of italic drama" },
    ],
  }),
  buildFontGroup({
    id: "body-font",
    title: "3. Body/Description Font",
    description: "Touches descriptions, helper copy, input labels, issue descriptions, and sidebars.",
    cssVar: "--font-body",
    sample: "Built like a briefing memo, not a chatbot landing page.",
    options: [
      { label: "IBM Plex Sans", value: "'IBM Plex Sans', sans-serif", note: "Default UI body" },
      { label: "Inter", value: "'Inter', sans-serif", note: "Neutral fallback baseline" },
      { label: "Public Sans", value: "'Public Sans', sans-serif", note: "Gov-grade restraint" },
      { label: "Work Sans", value: "'Work Sans', sans-serif", note: "Slightly warmer UI tone" },
      { label: "Source Sans 3", value: "'Source Sans 3', sans-serif", note: "Soft utilitarian read" },
      { label: "Manrope", value: "'Manrope', sans-serif", note: "Contemporary polish" },
      { label: "Plus Jakarta Sans", value: "'Plus Jakarta Sans', sans-serif", note: "Modern and tight" },
      { label: "DM Sans", value: "'DM Sans', sans-serif", note: "Use only if the rest is sharper" },
      { label: "Space Grotesk", value: "'Space Grotesk', sans-serif", note: "More personality" },
      { label: "Sora", value: "'Sora', sans-serif", note: "Rounded but assertive" },
      { label: "Lora", value: "'Lora', serif", note: "Unexpected body serif" },
      { label: "Spectral", value: "'Spectral', serif", note: "Editorial longform body" },
    ],
  }),
  buildFontGroup({
    id: "stat-numbers",
    title: "4. Stat Numbers & Labels",
    description: "Used for scores, numbers, audit metadata, and finance-coded microcopy.",
    cssVar: "--font-mono",
    sample: "87 / 100",
    options: [
      { label: "JetBrains Mono", value: "'JetBrains Mono', monospace", note: "Default signal-rich mono" },
      { label: "IBM Plex Mono", value: "'IBM Plex Mono', monospace", note: "Terminal, but lighter" },
      { label: "Space Mono", value: "'Space Mono', monospace", note: "Chunkier retro read" },
      { label: "DM Mono", value: "'DM Mono', monospace", note: "Minimal mono" },
      { label: "Azeret Mono", value: "'Azeret Mono', monospace", note: "Angular mono" },
      { label: "Source Code Pro", value: "'Source Code Pro', monospace", note: "Classic developer mono" },
      { label: "Fira Code", value: "'Fira Code', monospace", note: "Dense with ligature DNA" },
      { label: "Inconsolata", value: "'Inconsolata', monospace", note: "Open and readable" },
      { label: "Roboto Mono", value: "'Roboto Mono', monospace", note: "Compact system-feel mono" },
      { label: "Red Hat Mono", value: "'Red Hat Mono', monospace", note: "Technical but restrained" },
      { label: "PT Mono", value: "'PT Mono', monospace", note: "Utility-room mono" },
      { label: "Anonymous Pro", value: "'Anonymous Pro', monospace", note: "Lighter archival mono" },
    ],
  }),
];

const tokenGroups = [
  buildTokenGroup({
    id: "page-background",
    title: "5. Page Background",
    description: "Changes the site atmosphere without breaking contrast across pages.",
    renderPreview: (option) => `
      <div class="swatch-preview" style="${styleString(option.tokens)}">
        <div class="swatch-row">
          <span class="swatch-block" style="background:${option.tokens["--page-bg"]}"></span>
          <span class="swatch-block" style="background:${option.tokens["--surface-2"] || "rgba(255,255,255,0.08)"}"></span>
          <span class="swatch-block" style="background:${option.tokens["--accent-soft"] || "rgba(255,255,255,0.08)"}"></span>
        </div>
        <div class="design-card-meta">${escapeHtml(option.note)}</div>
      </div>
    `,
    options: [
      {
        label: "Warm Ledger",
        note: "Warm black with brass haze",
        meta: "low-contrast warm black",
        tokens: {
          "--page-bg": "#090806",
          "--page-gradient":
            "radial-gradient(circle at top left, rgba(196, 158, 87, 0.08), transparent 32%), radial-gradient(circle at 85% 18%, rgba(102, 94, 78, 0.18), transparent 24%), linear-gradient(180deg, rgba(17, 14, 11, 0.86), rgba(9, 8, 6, 1))",
          "--grid-tint": "rgba(239, 232, 220, 0.045)",
        },
      },
      {
        label: "True Black",
        note: "Sharp, almost terminal-black",
        meta: "near-black with minimal warmth",
        tokens: {
          "--page-bg": "#040404",
          "--page-gradient":
            "radial-gradient(circle at top left, rgba(212, 168, 83, 0.05), transparent 26%), linear-gradient(180deg, rgba(12, 12, 12, 0.86), rgba(4, 4, 4, 1))",
          "--grid-tint": "rgba(255, 255, 255, 0.03)",
        },
      },
      {
        label: "Graphite Wash",
        note: "Cool slate with gentle fog",
        meta: "cool dark graphite",
        tokens: {
          "--page-bg": "#0b0d10",
          "--page-gradient":
            "radial-gradient(circle at 10% 0%, rgba(149, 175, 192, 0.08), transparent 32%), linear-gradient(180deg, rgba(17, 22, 27, 0.88), rgba(11, 13, 16, 1))",
          "--grid-tint": "rgba(224, 232, 240, 0.04)",
        },
      },
      {
        label: "Midnight Blueprint",
        note: "Subtle banking-blue grid",
        meta: "deep navy without SaaS glow",
        tokens: {
          "--page-bg": "#071019",
          "--page-gradient":
            "radial-gradient(circle at 85% 12%, rgba(83, 134, 168, 0.14), transparent 28%), linear-gradient(180deg, rgba(10, 18, 29, 0.86), rgba(7, 16, 25, 1))",
          "--grid-tint": "rgba(184, 212, 230, 0.04)",
        },
      },
      {
        label: "Carbon Grid",
        note: "Denser grid read, higher contrast",
        meta: "structured carbon backdrop",
        tokens: {
          "--page-bg": "#0a0a0a",
          "--page-gradient":
            "radial-gradient(circle at top right, rgba(226, 188, 119, 0.07), transparent 24%), linear-gradient(180deg, rgba(18, 18, 18, 0.92), rgba(10, 10, 10, 1))",
          "--grid-tint": "rgba(255, 255, 255, 0.055)",
        },
      },
      {
        label: "Slate Fog",
        note: "Muted steel with low warmth",
        meta: "cooler and quieter",
        tokens: {
          "--page-bg": "#11151a",
          "--page-gradient":
            "radial-gradient(circle at 18% 0%, rgba(164, 176, 189, 0.08), transparent 28%), linear-gradient(180deg, rgba(18, 22, 28, 0.88), rgba(17, 21, 26, 1))",
          "--grid-tint": "rgba(220, 228, 236, 0.04)",
        },
      },
      {
        label: "Bronze Night",
        note: "Darker oxide and amber cast",
        meta: "warm bronze undertone",
        tokens: {
          "--page-bg": "#110c09",
          "--page-gradient":
            "radial-gradient(circle at 90% 12%, rgba(184, 115, 51, 0.14), transparent 26%), linear-gradient(180deg, rgba(22, 15, 11, 0.88), rgba(17, 12, 9, 1))",
          "--grid-tint": "rgba(240, 225, 210, 0.04)",
        },
      },
      {
        label: "Quiet Sepia",
        note: "Dustier and archival",
        meta: "soft sepia-black",
        tokens: {
          "--page-bg": "#120f0d",
          "--page-gradient":
            "radial-gradient(circle at 15% 8%, rgba(178, 142, 102, 0.1), transparent 26%), linear-gradient(180deg, rgba(24, 19, 17, 0.88), rgba(18, 15, 13, 1))",
          "--grid-tint": "rgba(230, 215, 196, 0.04)",
        },
      },
      {
        label: "Ash Paper",
        note: "Softer paper-charcoal mix",
        meta: "slightly lighter dark base",
        tokens: {
          "--page-bg": "#161411",
          "--page-gradient":
            "radial-gradient(circle at top left, rgba(220, 215, 202, 0.06), transparent 32%), linear-gradient(180deg, rgba(25, 23, 19, 0.9), rgba(22, 20, 17, 1))",
          "--grid-tint": "rgba(244, 240, 230, 0.04)",
        },
      },
      {
        label: "Deep Olive",
        note: "Muted green-black fund room",
        meta: "olive undertone",
        tokens: {
          "--page-bg": "#0f120f",
          "--page-gradient":
            "radial-gradient(circle at 80% 20%, rgba(112, 126, 96, 0.12), transparent 24%), linear-gradient(180deg, rgba(18, 21, 18, 0.9), rgba(15, 18, 15, 1))",
          "--grid-tint": "rgba(224, 232, 215, 0.04)",
        },
      },
      {
        label: "Oxide Smoke",
        note: "Muted red-brown cast",
        meta: "quiet copper smoke",
        tokens: {
          "--page-bg": "#140f0f",
          "--page-gradient":
            "radial-gradient(circle at 12% 12%, rgba(172, 104, 84, 0.12), transparent 26%), linear-gradient(180deg, rgba(24, 18, 18, 0.88), rgba(20, 15, 15, 1))",
          "--grid-tint": "rgba(236, 224, 220, 0.04)",
        },
      },
      {
        label: "Zinc Night",
        note: "Harder metallic neutrality",
        meta: "technical zinc-black",
        tokens: {
          "--page-bg": "#0d1012",
          "--page-gradient":
            "radial-gradient(circle at 86% 10%, rgba(112, 124, 134, 0.1), transparent 22%), linear-gradient(180deg, rgba(16, 20, 23, 0.92), rgba(13, 16, 18, 1))",
          "--grid-tint": "rgba(228, 232, 236, 0.045)",
        },
      },
    ],
  }),
  buildTokenGroup({
    id: "form-card-bg",
    title: "6. Form Card Background",
    description: "Controls panels, cards, forms, and every elevated block on the results page.",
    renderPreview: (option) => `
      <div class="swatch-preview">
        <div class="swatch-row">
          <span class="swatch-block" style="background:${option.tokens["--surface-1"]}"></span>
          <span class="swatch-block" style="background:${option.tokens["--surface-2"]}"></span>
          <span class="swatch-block" style="background:${option.tokens["--surface-3"]}"></span>
        </div>
        <div class="design-card-meta">${escapeHtml(option.note)}</div>
      </div>
    `,
    options: [
      {
        label: "Smoked Ink",
        note: "Default warm dark panels",
        meta: "dense surfaces with mild glow",
        tokens: {
          "--surface-1": "rgba(20, 17, 14, 0.86)",
          "--surface-2": "#171310",
          "--surface-3": "#221d18",
          "--surface-border": "rgba(239, 232, 220, 0.08)",
          "--surface-border-strong": "rgba(196, 158, 87, 0.22)",
          "--shadow-soft": "none",
        },
      },
      {
        label: "Papered Charcoal",
        note: "Slightly lighter paper tint",
        meta: "warmer card bodies",
        tokens: {
          "--surface-1": "rgba(31, 28, 24, 0.88)",
          "--surface-2": "#201c18",
          "--surface-3": "#2c2721",
          "--surface-border": "rgba(246, 240, 232, 0.08)",
          "--surface-border-strong": "rgba(214, 189, 146, 0.22)",
          "--shadow-soft": "none",
        },
      },
      {
        label: "Black Glass",
        note: "Clearer, crisper glass",
        meta: "cool dark glazing",
        tokens: {
          "--surface-1": "rgba(14, 16, 19, 0.76)",
          "--surface-2": "#111419",
          "--surface-3": "#1b2027",
          "--surface-border": "rgba(232, 238, 244, 0.08)",
          "--surface-border-strong": "rgba(160, 184, 204, 0.2)",
          "--shadow-soft": "none",
        },
      },
      {
        label: "Stone Ledger",
        note: "Warm stone cards",
        meta: "muted and archival",
        tokens: {
          "--surface-1": "rgba(34, 29, 25, 0.86)",
          "--surface-2": "#27211d",
          "--surface-3": "#352d27",
          "--surface-border": "rgba(240, 232, 224, 0.08)",
          "--surface-border-strong": "rgba(198, 169, 123, 0.22)",
          "--shadow-soft": "none",
        },
      },
      {
        label: "Trading Floor",
        note: "Harder and more matte",
        meta: "minimal surface contrast",
        tokens: {
          "--surface-1": "rgba(16, 16, 16, 0.88)",
          "--surface-2": "#141414",
          "--surface-3": "#1b1b1b",
          "--surface-border": "rgba(255, 255, 255, 0.06)",
          "--surface-border-strong": "rgba(212, 168, 83, 0.18)",
          "--shadow-soft": "none",
        },
      },
      {
        label: "Slate Board",
        note: "Softer cool panel system",
        meta: "blue-gray panel stack",
        tokens: {
          "--surface-1": "rgba(23, 28, 33, 0.84)",
          "--surface-2": "#1a2128",
          "--surface-3": "#25303a",
          "--surface-border": "rgba(228, 236, 242, 0.08)",
          "--surface-border-strong": "rgba(132, 156, 178, 0.2)",
          "--shadow-soft": "none",
        },
      },
      {
        label: "Velvet Black",
        note: "Softer premium density",
        meta: "velvet dark surfaces",
        tokens: {
          "--surface-1": "rgba(18, 14, 14, 0.9)",
          "--surface-2": "#181212",
          "--surface-3": "#221919",
          "--surface-border": "rgba(239, 232, 220, 0.06)",
          "--surface-border-strong": "rgba(196, 158, 87, 0.16)",
          "--shadow-soft": "none",
        },
      },
      {
        label: "Zinc Sheet",
        note: "More technical and metallic",
        meta: "zinc-gray elevation",
        tokens: {
          "--surface-1": "rgba(20, 23, 26, 0.88)",
          "--surface-2": "#191d21",
          "--surface-3": "#242b31",
          "--surface-border": "rgba(231, 235, 238, 0.08)",
          "--surface-border-strong": "rgba(176, 188, 196, 0.2)",
          "--shadow-soft": "none",
        },
      },
      {
        label: "Bronze Ledger",
        note: "Stronger warm-metal presence",
        meta: "bronze-edged surface system",
        tokens: {
          "--surface-1": "rgba(28, 20, 16, 0.9)",
          "--surface-2": "#211812",
          "--surface-3": "#32261c",
          "--surface-border": "rgba(245, 236, 228, 0.07)",
          "--surface-border-strong": "rgba(184, 115, 51, 0.24)",
          "--shadow-soft": "none",
        },
      },
      {
        label: "Olive Paper",
        note: "Fund memo undertone",
        meta: "olive charcoal panels",
        tokens: {
          "--surface-1": "rgba(20, 24, 20, 0.88)",
          "--surface-2": "#1a1f1a",
          "--surface-3": "#242b23",
          "--surface-border": "rgba(226, 232, 220, 0.08)",
          "--surface-border-strong": "rgba(144, 158, 121, 0.22)",
          "--shadow-soft": "none",
        },
      },
      {
        label: "Neutral Clay",
        note: "Dustier and softer edge",
        meta: "clay charcoal panels",
        tokens: {
          "--surface-1": "rgba(31, 27, 24, 0.88)",
          "--surface-2": "#27211d",
          "--surface-3": "#332b26",
          "--surface-border": "rgba(241, 235, 229, 0.08)",
          "--surface-border-strong": "rgba(188, 158, 140, 0.22)",
          "--shadow-soft": "none",
        },
      },
      {
        label: "Archive Slate",
        note: "Quiet and flat archival panels",
        meta: "document-room slate",
        tokens: {
          "--surface-1": "rgba(25, 25, 27, 0.88)",
          "--surface-2": "#1d1d20",
          "--surface-3": "#28282d",
          "--surface-border": "rgba(236, 236, 240, 0.07)",
          "--surface-border-strong": "rgba(168, 168, 176, 0.2)",
          "--shadow-soft": "none",
        },
      },
    ],
  }),
  buildTokenGroup({
    id: "text-color-palette",
    title: "7. Text Color Palette",
    description: "Updates headline, body, and tertiary text on every page, including result annotations.",
    renderPreview: (option) => `
      <div class="swatch-preview">
        <div class="font-preview" style="${styleString(option.tokens)}">
          <strong style="color:${option.tokens["--ink-1"]}">Bench Summary</strong>
          <span style="color:${option.tokens["--ink-2"]}">Text contrast stays deliberate.</span>
        </div>
      </div>
    `,
    options: [
      {
        label: "Ivory Stone",
        note: "Default warm editorial contrast",
        meta: "off-white + warm gray",
        tokens: {
          "--ink-1": "#efe8dc",
          "--ink-2": "#b6ad9f",
          "--ink-3": "#7f7467",
        },
      },
      {
        label: "Pure Paper",
        note: "Cleaner off-white stack",
        meta: "brighter neutral read",
        tokens: {
          "--ink-1": "#f5f3ee",
          "--ink-2": "#c2bbb0",
          "--ink-3": "#8d857a",
        },
      },
      {
        label: "Silver Ink",
        note: "Cooler and sharper",
        meta: "silver-blue text",
        tokens: {
          "--ink-1": "#e7edf4",
          "--ink-2": "#afb8c2",
          "--ink-3": "#78838d",
        },
      },
      {
        label: "Soft Parchment",
        note: "More archival warmth",
        meta: "paper-cream contrast",
        tokens: {
          "--ink-1": "#f2eadf",
          "--ink-2": "#c4b8a6",
          "--ink-3": "#8f806e",
        },
      },
      {
        label: "Stone Gray",
        note: "Muted and understated",
        meta: "lower-contrast but legible",
        tokens: {
          "--ink-1": "#ddd7cf",
          "--ink-2": "#aba39a",
          "--ink-3": "#756d65",
        },
      },
      {
        label: "Blue Smoke",
        note: "Cool investment desk lean",
        meta: "slightly bluish text",
        tokens: {
          "--ink-1": "#e0e7ee",
          "--ink-2": "#aeb6c1",
          "--ink-3": "#738190",
        },
      },
      {
        label: "Clay Ivory",
        note: "Heavier warm-beige body",
        meta: "muted clay highlights",
        tokens: {
          "--ink-1": "#ede2d4",
          "--ink-2": "#bea999",
          "--ink-3": "#887364",
        },
      },
      {
        label: "Neutral Linen",
        note: "Less gold, more linen",
        meta: "balanced neutral text",
        tokens: {
          "--ink-1": "#ece8e0",
          "--ink-2": "#b8b1a6",
          "--ink-3": "#7e776c",
        },
      },
      {
        label: "Graphite Chalk",
        note: "Sharper tertiary separation",
        meta: "clear headline pop",
        tokens: {
          "--ink-1": "#f0f2f3",
          "--ink-2": "#b9c0c4",
          "--ink-3": "#7b8489",
        },
      },
      {
        label: "Muted Copper",
        note: "Warm but slightly darker",
        meta: "dimmer body text",
        tokens: {
          "--ink-1": "#e7ddd2",
          "--ink-2": "#ad9f92",
          "--ink-3": "#77685c",
        },
      },
      {
        label: "Green Room",
        note: "Olive-neutral text tint",
        meta: "subtle fund-room cast",
        tokens: {
          "--ink-1": "#e2e6dc",
          "--ink-2": "#aeb5a4",
          "--ink-3": "#76806d",
        },
      },
      {
        label: "Frosted Slate",
        note: "Coolest readable text stack",
        meta: "slate-blue cool text",
        tokens: {
          "--ink-1": "#e1e8ec",
          "--ink-2": "#acb6bd",
          "--ink-3": "#727f88",
        },
      },
    ],
  }),
  buildTokenGroup({
    id: "border-radius",
    title: "8. Border Radius",
    description: "Removes the default soft rounded look and sharpens every surface, field, and button.",
    renderPreview: (option) => `
      <div class="shape-preview" style="${styleString(option.tokens)}">
        <span style="border-radius:${option.tokens["--radius-sm"]}"></span>
        <span style="border-radius:${option.tokens["--radius-md"]}"></span>
        <span style="border-radius:${option.tokens["--radius-lg"]}"></span>
      </div>
    `,
    options: [
      {
        label: "Tailored",
        note: "Default sharpened radius",
        meta: "small corners, premium restraint",
        tokens: {
          "--radius-xs": "2px",
          "--radius-sm": "4px",
          "--radius-md": "8px",
          "--radius-lg": "14px",
          "--radius-xl": "24px",
          "--radius-pill": "999px",
        },
      },
      {
        label: "Terminal Sharp",
        note: "Almost fully squared",
        meta: "minimal corner softness",
        tokens: {
          "--radius-xs": "0px",
          "--radius-sm": "2px",
          "--radius-md": "4px",
          "--radius-lg": "8px",
          "--radius-xl": "12px",
          "--radius-pill": "999px",
        },
      },
      {
        label: "Memo Cut",
        note: "Small but visible paper cut",
        meta: "tight editorial radius",
        tokens: {
          "--radius-xs": "2px",
          "--radius-sm": "3px",
          "--radius-md": "6px",
          "--radius-lg": "10px",
          "--radius-xl": "16px",
          "--radius-pill": "999px",
        },
      },
      {
        label: "Ledger Soft",
        note: "Softer cards, still not bubbly",
        meta: "medium corner softness",
        tokens: {
          "--radius-xs": "4px",
          "--radius-sm": "8px",
          "--radius-md": "12px",
          "--radius-lg": "18px",
          "--radius-xl": "26px",
          "--radius-pill": "999px",
        },
      },
      {
        label: "Gallery Curve",
        note: "Rounder but still disciplined",
        meta: "curved premium corners",
        tokens: {
          "--radius-xs": "6px",
          "--radius-sm": "10px",
          "--radius-md": "14px",
          "--radius-lg": "22px",
          "--radius-xl": "30px",
          "--radius-pill": "999px",
        },
      },
      {
        label: "Cardinal",
        note: "Nearly square cards, softer shells",
        meta: "sharp internals, gentle wrappers",
        tokens: {
          "--radius-xs": "1px",
          "--radius-sm": "3px",
          "--radius-md": "6px",
          "--radius-lg": "18px",
          "--radius-xl": "30px",
          "--radius-pill": "999px",
        },
      },
      {
        label: "Folded Sheet",
        note: "Bigger shell curves, small controls",
        meta: "page shells feel like sheets",
        tokens: {
          "--radius-xs": "2px",
          "--radius-sm": "4px",
          "--radius-md": "7px",
          "--radius-lg": "22px",
          "--radius-xl": "34px",
          "--radius-pill": "999px",
        },
      },
      {
        label: "Notched",
        note: "Angular-small system",
        meta: "severe small corner language",
        tokens: {
          "--radius-xs": "0px",
          "--radius-sm": "1px",
          "--radius-md": "3px",
          "--radius-lg": "12px",
          "--radius-xl": "18px",
          "--radius-pill": "999px",
        },
      },
      {
        label: "Soft Archive",
        note: "Paper-friendly softer shells",
        meta: "a little more hospitality",
        tokens: {
          "--radius-xs": "3px",
          "--radius-sm": "6px",
          "--radius-md": "10px",
          "--radius-lg": "16px",
          "--radius-xl": "22px",
          "--radius-pill": "999px",
        },
      },
      {
        label: "Sculpted",
        note: "Larger sculpted corners",
        meta: "decorative but still controlled",
        tokens: {
          "--radius-xs": "8px",
          "--radius-sm": "12px",
          "--radius-md": "16px",
          "--radius-lg": "24px",
          "--radius-xl": "36px",
          "--radius-pill": "999px",
        },
      },
      {
        label: "Needle",
        note: "Aggressively square small pieces",
        meta: "hard technical edge",
        tokens: {
          "--radius-xs": "0px",
          "--radius-sm": "0px",
          "--radius-md": "2px",
          "--radius-lg": "6px",
          "--radius-xl": "10px",
          "--radius-pill": "999px",
        },
      },
      {
        label: "Quiet Round",
        note: "Softest viable direction",
        meta: "still less generic than SaaS",
        tokens: {
          "--radius-xs": "6px",
          "--radius-sm": "10px",
          "--radius-md": "14px",
          "--radius-lg": "20px",
          "--radius-xl": "28px",
          "--radius-pill": "999px",
        },
      },
    ],
  }),
  buildTokenGroup({
    id: "cta-button",
    title: "9. CTA Button",
    description: "Every primary action button updates, including landing, upload, and results controls.",
    renderPreview: renderStaticCtaPreview,
    options: [
      {
        label: "Ghost Outline",
        note: "Default sharp ghost button",
        meta: "transparent with brass outline",
        tokens: {
          "--button-bg": "transparent",
          "--button-fg": "var(--accent)",
          "--button-border": "1px solid color-mix(in srgb, var(--accent) 82%, black 18%)",
          "--button-shadow": "none",
          "--button-radius": "var(--radius-sm)",
          "--button-letter-spacing": "0.11em",
          "--button-transform": "uppercase",
          "--button-weight": "600",
          "--button-hover-bg": "var(--accent-soft)",
          "--button-secondary-bg": "rgba(239, 232, 220, 0.03)",
          "--button-secondary-border": "1px solid var(--surface-border)",
          "--button-secondary-fg": "var(--ink-1)",
          "--button-padding-inline": "1.1rem",
          "--button-padding-block": "0.92rem",
          "--button-icon-opacity": "0.9",
          "--button-icon-shift": "0px",
        },
      },
      {
        label: "Solid Brass",
        note: "Filled but not glossy",
        meta: "solid accent fill",
        tokens: {
          "--button-bg": "var(--accent)",
          "--button-fg": "var(--accent-contrast)",
          "--button-border": "1px solid transparent",
          "--button-shadow": "none",
          "--button-radius": "var(--radius-sm)",
          "--button-letter-spacing": "0.08em",
          "--button-transform": "uppercase",
          "--button-weight": "700",
          "--button-hover-bg": "color-mix(in srgb, var(--accent) 78%, white 22%)",
          "--button-secondary-bg": "transparent",
          "--button-secondary-border": "1px solid color-mix(in srgb, var(--accent) 40%, var(--surface-border) 60%)",
          "--button-secondary-fg": "var(--ink-1)",
          "--button-padding-inline": "1.15rem",
          "--button-padding-block": "0.94rem",
          "--button-icon-opacity": "0.75",
          "--button-icon-shift": "1px",
        },
      },
      {
        label: "Underlined Memo",
        note: "No pill, just a ruled CTA",
        meta: "editorial underline action",
        tokens: {
          "--button-bg": "transparent",
          "--button-fg": "var(--ink-1)",
          "--button-border": "0 solid transparent",
          "--button-shadow": "inset 0 -1px 0 var(--accent)",
          "--button-radius": "0px",
          "--button-letter-spacing": "0.06em",
          "--button-transform": "none",
          "--button-weight": "600",
          "--button-hover-bg": "rgba(255,255,255,0.03)",
          "--button-secondary-bg": "transparent",
          "--button-secondary-border": "0 solid transparent",
          "--button-secondary-fg": "var(--ink-2)",
          "--button-padding-inline": "0rem",
          "--button-padding-block": "0.65rem",
          "--button-icon-opacity": "0.65",
          "--button-icon-shift": "2px",
        },
      },
      {
        label: "Ledger Band",
        note: "Thick lower band emphasis",
        meta: "bottom-band weighted CTA",
        tokens: {
          "--button-bg": "rgba(255,255,255,0.03)",
          "--button-fg": "var(--ink-1)",
          "--button-border": "1px solid rgba(255,255,255,0.08)",
          "--button-shadow": "inset 0 -4px 0 var(--accent)",
          "--button-radius": "var(--radius-sm)",
          "--button-letter-spacing": "0.09em",
          "--button-transform": "uppercase",
          "--button-weight": "700",
          "--button-hover-bg": "rgba(255,255,255,0.06)",
          "--button-secondary-bg": "transparent",
          "--button-secondary-border": "1px solid rgba(255,255,255,0.08)",
          "--button-secondary-fg": "var(--ink-2)",
          "--button-padding-inline": "1.1rem",
          "--button-padding-block": "0.95rem",
          "--button-icon-opacity": "0.85",
          "--button-icon-shift": "0px",
        },
      },
      {
        label: "Capsule Mark",
        note: "Sharper capsule but not SaaS-soft",
        meta: "capsule with text restraint",
        tokens: {
          "--button-bg": "rgba(255,255,255,0.05)",
          "--button-fg": "var(--ink-1)",
          "--button-border": "1px solid rgba(255,255,255,0.12)",
          "--button-shadow": "none",
          "--button-radius": "999px",
          "--button-letter-spacing": "0.08em",
          "--button-transform": "uppercase",
          "--button-weight": "600",
          "--button-hover-bg": "rgba(255,255,255,0.08)",
          "--button-secondary-bg": "transparent",
          "--button-secondary-border": "1px solid rgba(255,255,255,0.08)",
          "--button-secondary-fg": "var(--ink-2)",
          "--button-padding-inline": "1.35rem",
          "--button-padding-block": "0.9rem",
          "--button-icon-opacity": "0.55",
          "--button-icon-shift": "1px",
        },
      },
      {
        label: "Stamp Fill",
        note: "Filled block with tighter spacing",
        meta: "stamped label read",
        tokens: {
          "--button-bg": "color-mix(in srgb, var(--accent) 86%, black 14%)",
          "--button-fg": "var(--accent-contrast)",
          "--button-border": "1px solid transparent",
          "--button-shadow": "none",
          "--button-radius": "var(--radius-xs)",
          "--button-letter-spacing": "0.14em",
          "--button-transform": "uppercase",
          "--button-weight": "700",
          "--button-hover-bg": "color-mix(in srgb, var(--accent) 76%, white 24%)",
          "--button-secondary-bg": "rgba(255,255,255,0.04)",
          "--button-secondary-border": "1px solid rgba(255,255,255,0.08)",
          "--button-secondary-fg": "var(--ink-1)",
          "--button-padding-inline": "1rem",
          "--button-padding-block": "0.88rem",
          "--button-icon-opacity": "0.9",
          "--button-icon-shift": "0px",
        },
      },
      {
        label: "Hairline White",
        note: "Minimal white-line system",
        meta: "white hairline CTA",
        tokens: {
          "--button-bg": "transparent",
          "--button-fg": "var(--ink-1)",
          "--button-border": "1px solid rgba(255,255,255,0.18)",
          "--button-shadow": "none",
          "--button-radius": "var(--radius-sm)",
          "--button-letter-spacing": "0.12em",
          "--button-transform": "uppercase",
          "--button-weight": "600",
          "--button-hover-bg": "rgba(255,255,255,0.05)",
          "--button-secondary-bg": "transparent",
          "--button-secondary-border": "1px solid rgba(255,255,255,0.08)",
          "--button-secondary-fg": "var(--ink-2)",
          "--button-padding-inline": "1.1rem",
          "--button-padding-block": "0.9rem",
          "--button-icon-opacity": "0.75",
          "--button-icon-shift": "0px",
        },
      },
      {
        label: "Dual Rail",
        note: "Accent rails above and below",
        meta: "ruled-paper action style",
        tokens: {
          "--button-bg": "rgba(255,255,255,0.02)",
          "--button-fg": "var(--ink-1)",
          "--button-border": "1px solid rgba(255,255,255,0.06)",
          "--button-shadow": "inset 0 2px 0 var(--accent), inset 0 -2px 0 var(--accent)",
          "--button-radius": "var(--radius-sm)",
          "--button-letter-spacing": "0.11em",
          "--button-transform": "uppercase",
          "--button-weight": "700",
          "--button-hover-bg": "rgba(255,255,255,0.05)",
          "--button-secondary-bg": "transparent",
          "--button-secondary-border": "1px solid rgba(255,255,255,0.08)",
          "--button-secondary-fg": "var(--ink-2)",
          "--button-padding-inline": "1.05rem",
          "--button-padding-block": "0.9rem",
          "--button-icon-opacity": "0.8",
          "--button-icon-shift": "1px",
        },
      },
      {
        label: "Quiet Slab",
        note: "Solid neutral slab with accent text",
        meta: "muted slab action",
        tokens: {
          "--button-bg": "var(--surface-3)",
          "--button-fg": "var(--accent)",
          "--button-border": "1px solid rgba(255,255,255,0.06)",
          "--button-shadow": "none",
          "--button-radius": "var(--radius-xs)",
          "--button-letter-spacing": "0.08em",
          "--button-transform": "uppercase",
          "--button-weight": "600",
          "--button-hover-bg": "color-mix(in srgb, var(--surface-3) 70%, white 30%)",
          "--button-secondary-bg": "transparent",
          "--button-secondary-border": "1px solid rgba(255,255,255,0.08)",
          "--button-secondary-fg": "var(--ink-2)",
          "--button-padding-inline": "1rem",
          "--button-padding-block": "0.88rem",
          "--button-icon-opacity": "0.7",
          "--button-icon-shift": "0px",
        },
      },
      {
        label: "Index Tag",
        note: "More label-like, less button-like",
        meta: "tag-format CTA",
        tokens: {
          "--button-bg": "var(--accent-soft)",
          "--button-fg": "var(--ink-1)",
          "--button-border": "1px solid rgba(196,158,87,0.22)",
          "--button-shadow": "none",
          "--button-radius": "var(--radius-pill)",
          "--button-letter-spacing": "0.15em",
          "--button-transform": "uppercase",
          "--button-weight": "700",
          "--button-hover-bg": "rgba(196,158,87,0.22)",
          "--button-secondary-bg": "transparent",
          "--button-secondary-border": "1px solid rgba(255,255,255,0.08)",
          "--button-secondary-fg": "var(--ink-2)",
          "--button-padding-inline": "1rem",
          "--button-padding-block": "0.75rem",
          "--button-icon-opacity": "0.5",
          "--button-icon-shift": "0px",
        },
      },
      {
        label: "Monotone Chip",
        note: "Accent removed from fill, kept as border",
        meta: "subdued monochrome action",
        tokens: {
          "--button-bg": "rgba(255,255,255,0.05)",
          "--button-fg": "var(--ink-1)",
          "--button-border": "1px solid rgba(255,255,255,0.14)",
          "--button-shadow": "none",
          "--button-radius": "999px",
          "--button-letter-spacing": "0.1em",
          "--button-transform": "uppercase",
          "--button-weight": "600",
          "--button-hover-bg": "rgba(255,255,255,0.08)",
          "--button-secondary-bg": "transparent",
          "--button-secondary-border": "1px solid rgba(255,255,255,0.06)",
          "--button-secondary-fg": "var(--ink-2)",
          "--button-padding-inline": "1.2rem",
          "--button-padding-block": "0.82rem",
          "--button-icon-opacity": "0.4",
          "--button-icon-shift": "0px",
        },
      },
      {
        label: "Raised Brass",
        note: "Filled accent with subtle lift",
        meta: "slight depth without SaaS glow",
        tokens: {
          "--button-bg": "var(--accent)",
          "--button-fg": "var(--accent-contrast)",
          "--button-border": "1px solid color-mix(in srgb, var(--accent) 75%, black 25%)",
          "--button-shadow": "0 6px 18px rgba(0,0,0,0.16)",
          "--button-radius": "var(--radius-sm)",
          "--button-letter-spacing": "0.09em",
          "--button-transform": "uppercase",
          "--button-weight": "700",
          "--button-hover-bg": "color-mix(in srgb, var(--accent) 72%, white 28%)",
          "--button-secondary-bg": "rgba(255,255,255,0.03)",
          "--button-secondary-border": "1px solid rgba(255,255,255,0.08)",
          "--button-secondary-fg": "var(--ink-1)",
          "--button-padding-inline": "1.1rem",
          "--button-padding-block": "0.92rem",
          "--button-icon-opacity": "0.8",
          "--button-icon-shift": "1px",
        },
      },
    ],
  }),
  buildTokenGroup({
    id: "gold-accent",
    title: "10. Gold Accent Color",
    description: "Updates every active state, accent line, score ring, and highlighted callout.",
    renderPreview: (option) => `
      <div class="swatch-preview">
        <div class="swatch-row">
          <span class="swatch-block" style="background:${option.tokens["--accent"]}"></span>
          <span class="swatch-block" style="background:${option.tokens["--accent-strong"]}"></span>
          <span class="swatch-block" style="background:${option.tokens["--accent-soft"]}"></span>
        </div>
        <div class="design-card-meta">${escapeHtml(option.note)}</div>
      </div>
    `,
    options: [
      {
        label: "Brass",
        note: "Default warm brass",
        meta: "brass/gold hybrid",
        tokens: {
          "--accent": "#c49e57",
          "--accent-strong": "#e0bc77",
          "--accent-soft": "rgba(196, 158, 87, 0.15)",
          "--accent-contrast": "#110c07",
        },
      },
      {
        label: "Old Gold",
        note: "More muted yellow-gold",
        meta: "older bank directory gold",
        tokens: {
          "--accent": "#b88f3d",
          "--accent-strong": "#d8b764",
          "--accent-soft": "rgba(184, 143, 61, 0.16)",
          "--accent-contrast": "#130d05",
        },
      },
      {
        label: "Champagne",
        note: "Lighter and softer metallic",
        meta: "quiet champagne accent",
        tokens: {
          "--accent": "#d0bb94",
          "--accent-strong": "#ebdcc0",
          "--accent-soft": "rgba(208, 187, 148, 0.17)",
          "--accent-contrast": "#16110c",
        },
      },
      {
        label: "Copper",
        note: "Richer copper tone",
        meta: "warmer metal read",
        tokens: {
          "--accent": "#b87333",
          "--accent-strong": "#d89a5f",
          "--accent-soft": "rgba(184, 115, 51, 0.16)",
          "--accent-contrast": "#150d08",
        },
      },
      {
        label: "Oxide Rose",
        note: "Muted rose alloy",
        meta: "rose metal with restraint",
        tokens: {
          "--accent": "#b06f78",
          "--accent-strong": "#cd8f97",
          "--accent-soft": "rgba(176, 111, 120, 0.16)",
          "--accent-contrast": "#160d10",
        },
      },
      {
        label: "Emerald",
        note: "Green accent for fitter fund tone",
        meta: "green metallic accent",
        tokens: {
          "--accent": "#5ea57b",
          "--accent-strong": "#82c09a",
          "--accent-soft": "rgba(94, 165, 123, 0.16)",
          "--accent-contrast": "#0c140f",
        },
      },
      {
        label: "Cobalt",
        note: "Controlled blue accent",
        meta: "banking cobalt, not SaaS neon",
        tokens: {
          "--accent": "#5a7ea6",
          "--accent-strong": "#82a2c4",
          "--accent-soft": "rgba(90, 126, 166, 0.16)",
          "--accent-contrast": "#0d1117",
        },
      },
      {
        label: "Slate Silver",
        note: "Cool metallic neutral",
        meta: "silver-gray accent",
        tokens: {
          "--accent": "#a1aab3",
          "--accent-strong": "#c0c8d0",
          "--accent-soft": "rgba(161, 170, 179, 0.16)",
          "--accent-contrast": "#121518",
        },
      },
      {
        label: "Terracotta",
        note: "Earthier, more editorial",
        meta: "warm clay accent",
        tokens: {
          "--accent": "#c26d53",
          "--accent-strong": "#d88f78",
          "--accent-soft": "rgba(194, 109, 83, 0.16)",
          "--accent-contrast": "#160d0a",
        },
      },
      {
        label: "Saffron",
        note: "Brighter yellow-orange",
        meta: "louder but still warm",
        tokens: {
          "--accent": "#d49a38",
          "--accent-strong": "#ebb660",
          "--accent-soft": "rgba(212, 154, 56, 0.16)",
          "--accent-contrast": "#151007",
        },
      },
      {
        label: "Moss",
        note: "Muted olive-gold hybrid",
        meta: "green-gold restraint",
        tokens: {
          "--accent": "#8d9858",
          "--accent-strong": "#adb875",
          "--accent-soft": "rgba(141, 152, 88, 0.16)",
          "--accent-contrast": "#121308",
        },
      },
      {
        label: "Bone",
        note: "Near-neutral ivory accent",
        meta: "quiet bone highlight",
        tokens: {
          "--accent": "#c9c0af",
          "--accent-strong": "#dfd7c8",
          "--accent-soft": "rgba(201, 192, 175, 0.16)",
          "--accent-contrast": "#17130f",
        },
      },
    ],
  }),
  buildTokenGroup({
    id: "top-nav",
    title: "19. Top Navigation Bar",
    description: "Changes the navigation bar, shell framing, and tab treatment so the whole app does not read as a template.",
    renderPreview: (option) => `
      <div class="preview-frame" style="${styleString(option.tokens)}">
        <div class="preview-frame-nav">
          <span>Lab</span>
          <span>Landing</span>
          <span>Results</span>
        </div>
        <div class="preview-frame-band"></div>
      </div>
    `,
    options: [
      {
        label: "Segmented Rail",
        note: "Default segmented navigation with soft pills",
        meta: "segmented active rail",
        tokens: {
          "--frame-shell-bg": "rgba(12, 10, 8, 0.9)",
          "--frame-shell-border": "1px solid rgba(239, 232, 220, 0.08)",
          "--frame-shell-radius": "18px",
          "--frame-shell-padding": "1rem 1.2rem",
          "--frame-nav-gap": "0.4rem",
          "--frame-nav-border": "1px solid rgba(239, 232, 220, 0.08)",
          "--frame-nav-bg": "rgba(239, 232, 220, 0.03)",
          "--frame-nav-radius": "999px",
          "--frame-tab-bg": "transparent",
          "--frame-tab-border": "1px solid transparent",
          "--frame-tab-radius": "999px",
          "--frame-tab-transform": "uppercase",
          "--frame-tab-letter-spacing": "0.1em",
          "--frame-tab-active-bg": "rgba(196, 158, 87, 0.16)",
          "--frame-tab-active-border": "rgba(196, 158, 87, 0.48)",
          "--frame-tab-active-shadow": "none",
          "--frame-panel-outline": "1px solid rgba(239, 232, 220, 0.08)",
          "--frame-ribbon-border": "1px solid rgba(239, 232, 220, 0.08)",
          "--frame-ribbon-transform": "uppercase",
          "--frame-panel-rail": "inset 0 1px 0 rgba(255,255,255,0.02)",
        },
      },
      {
        label: "Hairline Index",
        note: "Thinner, sharper frame language",
        meta: "hairline tab system",
        tokens: {
          "--frame-shell-bg": "rgba(10, 10, 10, 0.88)",
          "--frame-shell-border": "1px solid rgba(255,255,255,0.06)",
          "--frame-shell-radius": "10px",
          "--frame-shell-padding": "0.9rem 1rem",
          "--frame-nav-gap": "0.25rem",
          "--frame-nav-border": "1px solid rgba(255,255,255,0.06)",
          "--frame-nav-bg": "rgba(255,255,255,0.02)",
          "--frame-nav-radius": "6px",
          "--frame-tab-bg": "transparent",
          "--frame-tab-border": "1px solid transparent",
          "--frame-tab-radius": "4px",
          "--frame-tab-transform": "uppercase",
          "--frame-tab-letter-spacing": "0.12em",
          "--frame-tab-active-bg": "rgba(255,255,255,0.04)",
          "--frame-tab-active-border": "rgba(255,255,255,0.12)",
          "--frame-tab-active-shadow": "none",
          "--frame-panel-outline": "1px solid rgba(255,255,255,0.06)",
          "--frame-ribbon-border": "1px solid rgba(255,255,255,0.06)",
          "--frame-ribbon-transform": "uppercase",
          "--frame-panel-rail": "none",
        },
      },
      {
        label: "Pill Strip",
        note: "More visible navigation strip",
        meta: "pill-heavy top frame",
        tokens: {
          "--frame-shell-bg": "rgba(16, 14, 12, 0.92)",
          "--frame-shell-border": "1px solid rgba(239,232,220,0.08)",
          "--frame-shell-radius": "24px",
          "--frame-shell-padding": "1rem 1.15rem",
          "--frame-nav-gap": "0.5rem",
          "--frame-nav-border": "1px solid rgba(239,232,220,0.06)",
          "--frame-nav-bg": "rgba(255,255,255,0.03)",
          "--frame-nav-radius": "999px",
          "--frame-tab-bg": "rgba(255,255,255,0.02)",
          "--frame-tab-border": "1px solid rgba(255,255,255,0.04)",
          "--frame-tab-radius": "999px",
          "--frame-tab-transform": "uppercase",
          "--frame-tab-letter-spacing": "0.09em",
          "--frame-tab-active-bg": "var(--accent)",
          "--frame-tab-active-border": "transparent",
          "--frame-tab-active-shadow": "none",
          "--frame-panel-outline": "1px solid rgba(239,232,220,0.08)",
          "--frame-ribbon-border": "1px solid rgba(255,255,255,0.06)",
          "--frame-ribbon-transform": "uppercase",
          "--frame-panel-rail": "none",
        },
      },
      {
        label: "Notched Frame",
        note: "Sharper tabs, tighter shell",
        meta: "notched terminal frame",
        tokens: {
          "--frame-shell-bg": "rgba(12, 12, 12, 0.92)",
          "--frame-shell-border": "1px solid rgba(255,255,255,0.07)",
          "--frame-shell-radius": "8px",
          "--frame-shell-padding": "0.85rem 0.95rem",
          "--frame-nav-gap": "0.3rem",
          "--frame-nav-border": "1px solid rgba(255,255,255,0.05)",
          "--frame-nav-bg": "rgba(255,255,255,0.02)",
          "--frame-nav-radius": "4px",
          "--frame-tab-bg": "transparent",
          "--frame-tab-border": "1px solid rgba(255,255,255,0.02)",
          "--frame-tab-radius": "2px",
          "--frame-tab-transform": "uppercase",
          "--frame-tab-letter-spacing": "0.12em",
          "--frame-tab-active-bg": "rgba(196,158,87,0.12)",
          "--frame-tab-active-border": "rgba(196,158,87,0.3)",
          "--frame-tab-active-shadow": "none",
          "--frame-panel-outline": "1px solid rgba(255,255,255,0.06)",
          "--frame-ribbon-border": "1px solid rgba(255,255,255,0.06)",
          "--frame-ribbon-transform": "uppercase",
          "--frame-panel-rail": "none",
        },
      },
      {
        label: "Quiet Card",
        note: "More invisible framing",
        meta: "reduced chrome overall",
        tokens: {
          "--frame-shell-bg": "rgba(15, 13, 11, 0.72)",
          "--frame-shell-border": "1px solid rgba(255,255,255,0.03)",
          "--frame-shell-radius": "20px",
          "--frame-shell-padding": "1rem 1.1rem",
          "--frame-nav-gap": "0.45rem",
          "--frame-nav-border": "1px solid rgba(255,255,255,0.04)",
          "--frame-nav-bg": "transparent",
          "--frame-nav-radius": "14px",
          "--frame-tab-bg": "transparent",
          "--frame-tab-border": "1px solid transparent",
          "--frame-tab-radius": "14px",
          "--frame-tab-transform": "none",
          "--frame-tab-letter-spacing": "0.02em",
          "--frame-tab-active-bg": "rgba(255,255,255,0.05)",
          "--frame-tab-active-border": "rgba(255,255,255,0.06)",
          "--frame-tab-active-shadow": "none",
          "--frame-panel-outline": "1px solid rgba(255,255,255,0.05)",
          "--frame-ribbon-border": "1px solid rgba(255,255,255,0.05)",
          "--frame-ribbon-transform": "none",
          "--frame-panel-rail": "none",
        },
      },
      {
        label: "Index Strip",
        note: "Tab labels read like an index",
        meta: "index-style nav language",
        tokens: {
          "--frame-shell-bg": "rgba(14, 12, 10, 0.9)",
          "--frame-shell-border": "1px solid rgba(255,255,255,0.06)",
          "--frame-shell-radius": "16px",
          "--frame-shell-padding": "0.95rem 1.1rem",
          "--frame-nav-gap": "0.8rem",
          "--frame-nav-border": "0 solid transparent",
          "--frame-nav-bg": "transparent",
          "--frame-nav-radius": "0px",
          "--frame-tab-bg": "transparent",
          "--frame-tab-border": "0 solid transparent",
          "--frame-tab-radius": "0px",
          "--frame-tab-transform": "uppercase",
          "--frame-tab-letter-spacing": "0.14em",
          "--frame-tab-active-bg": "transparent",
          "--frame-tab-active-border": "rgba(196,158,87,0.6)",
          "--frame-tab-active-shadow": "inset 0 -1px 0 var(--accent)",
          "--frame-panel-outline": "1px solid rgba(255,255,255,0.06)",
          "--frame-ribbon-border": "1px solid rgba(255,255,255,0.06)",
          "--frame-ribbon-transform": "uppercase",
          "--frame-panel-rail": "none",
        },
      },
      {
        label: "Slab Tabs",
        note: "Chunkier slabs without bubble feel",
        meta: "slabbed active tabs",
        tokens: {
          "--frame-shell-bg": "rgba(14, 12, 10, 0.92)",
          "--frame-shell-border": "1px solid rgba(255,255,255,0.06)",
          "--frame-shell-radius": "18px",
          "--frame-shell-padding": "1rem 1.15rem",
          "--frame-nav-gap": "0.4rem",
          "--frame-nav-border": "1px solid rgba(255,255,255,0.05)",
          "--frame-nav-bg": "rgba(255,255,255,0.02)",
          "--frame-nav-radius": "8px",
          "--frame-tab-bg": "rgba(255,255,255,0.02)",
          "--frame-tab-border": "1px solid rgba(255,255,255,0.02)",
          "--frame-tab-radius": "var(--radius-sm)",
          "--frame-tab-transform": "uppercase",
          "--frame-tab-letter-spacing": "0.09em",
          "--frame-tab-active-bg": "rgba(255,255,255,0.08)",
          "--frame-tab-active-border": "rgba(196,158,87,0.25)",
          "--frame-tab-active-shadow": "inset 0 -3px 0 var(--accent)",
          "--frame-panel-outline": "1px solid rgba(255,255,255,0.06)",
          "--frame-ribbon-border": "1px solid rgba(255,255,255,0.05)",
          "--frame-ribbon-transform": "uppercase",
          "--frame-panel-rail": "none",
        },
      },
      {
        label: "Monograph",
        note: "Large shell radius, softer nav",
        meta: "gallery-like shell treatment",
        tokens: {
          "--frame-shell-bg": "rgba(18, 16, 14, 0.9)",
          "--frame-shell-border": "1px solid rgba(255,255,255,0.05)",
          "--frame-shell-radius": "28px",
          "--frame-shell-padding": "1rem 1.25rem",
          "--frame-nav-gap": "0.35rem",
          "--frame-nav-border": "1px solid rgba(255,255,255,0.04)",
          "--frame-nav-bg": "rgba(255,255,255,0.02)",
          "--frame-nav-radius": "22px",
          "--frame-tab-bg": "transparent",
          "--frame-tab-border": "1px solid transparent",
          "--frame-tab-radius": "22px",
          "--frame-tab-transform": "none",
          "--frame-tab-letter-spacing": "0.04em",
          "--frame-tab-active-bg": "rgba(196,158,87,0.12)",
          "--frame-tab-active-border": "rgba(196,158,87,0.18)",
          "--frame-tab-active-shadow": "none",
          "--frame-panel-outline": "1px solid rgba(255,255,255,0.05)",
          "--frame-ribbon-border": "1px solid rgba(255,255,255,0.05)",
          "--frame-ribbon-transform": "none",
          "--frame-panel-rail": "none",
        },
      },
      {
        label: "Market Tape",
        note: "Ribbon becomes more ticker-like",
        meta: "ticker-forward framing",
        tokens: {
          "--frame-shell-bg": "rgba(10, 11, 12, 0.9)",
          "--frame-shell-border": "1px solid rgba(255,255,255,0.06)",
          "--frame-shell-radius": "14px",
          "--frame-shell-padding": "0.95rem 1.1rem",
          "--frame-nav-gap": "0.28rem",
          "--frame-nav-border": "1px solid rgba(255,255,255,0.04)",
          "--frame-nav-bg": "rgba(255,255,255,0.02)",
          "--frame-nav-radius": "10px",
          "--frame-tab-bg": "transparent",
          "--frame-tab-border": "1px solid transparent",
          "--frame-tab-radius": "10px",
          "--frame-tab-transform": "uppercase",
          "--frame-tab-letter-spacing": "0.15em",
          "--frame-tab-active-bg": "rgba(255,255,255,0.05)",
          "--frame-tab-active-border": "rgba(255,255,255,0.1)",
          "--frame-tab-active-shadow": "none",
          "--frame-panel-outline": "1px solid rgba(255,255,255,0.05)",
          "--frame-ribbon-border": "1px solid rgba(196,158,87,0.22)",
          "--frame-ribbon-transform": "uppercase",
          "--frame-panel-rail": "none",
        },
      },
      {
        label: "Rail Left",
        note: "More publication-like vertical framing",
        meta: "panel rail emphasis",
        tokens: {
          "--frame-shell-bg": "rgba(14, 12, 10, 0.9)",
          "--frame-shell-border": "1px solid rgba(255,255,255,0.06)",
          "--frame-shell-radius": "16px",
          "--frame-shell-padding": "1rem 1.15rem",
          "--frame-nav-gap": "0.42rem",
          "--frame-nav-border": "1px solid rgba(255,255,255,0.04)",
          "--frame-nav-bg": "rgba(255,255,255,0.02)",
          "--frame-nav-radius": "12px",
          "--frame-tab-bg": "transparent",
          "--frame-tab-border": "1px solid transparent",
          "--frame-tab-radius": "12px",
          "--frame-tab-transform": "uppercase",
          "--frame-tab-letter-spacing": "0.08em",
          "--frame-tab-active-bg": "rgba(196,158,87,0.12)",
          "--frame-tab-active-border": "rgba(196,158,87,0.22)",
          "--frame-tab-active-shadow": "none",
          "--frame-panel-outline": "1px solid rgba(255,255,255,0.06)",
          "--frame-ribbon-border": "1px solid rgba(255,255,255,0.05)",
          "--frame-ribbon-transform": "uppercase",
          "--frame-panel-rail": "inset 3px 0 0 var(--accent)",
        },
      },
      {
        label: "Document Edge",
        note: "Panels feel more like sheets",
        meta: "sheeted page frame",
        tokens: {
          "--frame-shell-bg": "rgba(18, 16, 14, 0.88)",
          "--frame-shell-border": "1px solid rgba(255,255,255,0.06)",
          "--frame-shell-radius": "24px",
          "--frame-shell-padding": "1rem 1.2rem",
          "--frame-nav-gap": "0.5rem",
          "--frame-nav-border": "1px solid rgba(255,255,255,0.04)",
          "--frame-nav-bg": "rgba(255,255,255,0.02)",
          "--frame-nav-radius": "8px",
          "--frame-tab-bg": "transparent",
          "--frame-tab-border": "1px solid transparent",
          "--frame-tab-radius": "var(--radius-sm)",
          "--frame-tab-transform": "none",
          "--frame-tab-letter-spacing": "0.03em",
          "--frame-tab-active-bg": "rgba(255,255,255,0.06)",
          "--frame-tab-active-border": "rgba(255,255,255,0.08)",
          "--frame-tab-active-shadow": "none",
          "--frame-panel-outline": "1px solid rgba(255,255,255,0.06)",
          "--frame-ribbon-border": "1px solid rgba(255,255,255,0.06)",
          "--frame-ribbon-transform": "uppercase",
          "--frame-panel-rail": "none",
        },
      },
      {
        label: "Quiet Shell",
        note: "Soft shell, crisp active tab",
        meta: "hybrid shell treatment",
        tokens: {
          "--frame-shell-bg": "rgba(13, 12, 11, 0.78)",
          "--frame-shell-border": "1px solid rgba(255,255,255,0.04)",
          "--frame-shell-radius": "30px",
          "--frame-shell-padding": "1rem 1.25rem",
          "--frame-nav-gap": "0.3rem",
          "--frame-nav-border": "1px solid rgba(255,255,255,0.04)",
          "--frame-nav-bg": "rgba(255,255,255,0.02)",
          "--frame-nav-radius": "20px",
          "--frame-tab-bg": "transparent",
          "--frame-tab-border": "1px solid transparent",
          "--frame-tab-radius": "20px",
          "--frame-tab-transform": "uppercase",
          "--frame-tab-letter-spacing": "0.1em",
          "--frame-tab-active-bg": "rgba(255,255,255,0.08)",
          "--frame-tab-active-border": "rgba(255,255,255,0.12)",
          "--frame-tab-active-shadow": "inset 0 0 0 1px rgba(255,255,255,0.04)",
          "--frame-panel-outline": "1px solid rgba(255,255,255,0.05)",
          "--frame-ribbon-border": "1px solid rgba(255,255,255,0.05)",
          "--frame-ribbon-transform": "none",
          "--frame-panel-rail": "none",
        },
      },
    ],
  }),
];

const newGroups = [
  buildTokenGroup({
    id: "bank-ticker",
    title: "11. Bank Ticker Bar",
    description: "Controls the landing ribbon shell, chip treatment, spacing, case, and rail structure.",
    renderPreview: renderTickerPreview,
    options: [
      {
        label: "Default Ticker",
        note: "Straight ledger rule with plain names.",
        meta: "minimal ruled ticker",
        tokens: {
          "--ticker-color": "var(--ink-3)",
          "--ticker-size": "0.72rem",
          "--ticker-spacing": "0.14em",
          "--ticker-transform": "uppercase",
          "--ticker-gap": "1.3rem",
          "--ticker-border": "1px solid rgba(239, 232, 220, 0.08)",
        },
      },
      {
        label: "Tight Tape",
        note: "Compressed tape with dense uppercase marks.",
        meta: "compressed deal tape",
        tokens: {
          "--ticker-color": "var(--ink-3)",
          "--ticker-size": "0.64rem",
          "--ticker-spacing": "0.2em",
          "--ticker-transform": "uppercase",
          "--ticker-gap": "0.8rem",
          "--ticker-border": "1px solid rgba(239, 232, 220, 0.06)",
          "--ticker-item-weight": "600",
        },
      },
      {
        label: "Wide Ledger",
        note: "Names sit inside a framed directory strip.",
        meta: "framed ledger strip",
        tokens: {
          "--ticker-color": "var(--ink-2)",
          "--ticker-size": "0.74rem",
          "--ticker-spacing": "0.08em",
          "--ticker-transform": "uppercase",
          "--ticker-gap": "1.1rem",
          "--ticker-border": "0 solid transparent",
          "--ticker-shell-bg": "rgba(255, 255, 255, 0.025)",
          "--ticker-shell-border": "1px solid rgba(255, 255, 255, 0.07)",
          "--ticker-shell-radius": "999px",
          "--ticker-shell-padding-block": "0.45rem",
          "--ticker-shell-padding-inline": "0.7rem",
        },
      },
      {
        label: "Sentence Case",
        note: "Turns the ticker into a softer directory row.",
        meta: "sentence-case directory",
        tokens: {
          "--ticker-color": "var(--ink-2)",
          "--ticker-size": "0.74rem",
          "--ticker-spacing": "0.03em",
          "--ticker-transform": "none",
          "--ticker-gap": "0.65rem",
          "--ticker-border": "0 solid transparent",
          "--ticker-item-bg": "rgba(255, 255, 255, 0.03)",
          "--ticker-item-border": "1px solid rgba(255, 255, 255, 0.05)",
          "--ticker-item-radius": "999px",
          "--ticker-item-padding-block": "0.32rem",
          "--ticker-item-padding-inline": "0.62rem",
          "--ticker-item-weight": "500",
        },
      },
      {
        label: "Brass Rule",
        note: "Full brass tape with dark ink labels.",
        meta: "accent tape bar",
        tokens: {
          "--ticker-color": "rgba(17, 12, 7, 0.9)",
          "--ticker-size": "0.68rem",
          "--ticker-spacing": "0.12em",
          "--ticker-transform": "uppercase",
          "--ticker-gap": "0.9rem",
          "--ticker-border": "0 solid transparent",
          "--ticker-shell-bg": "linear-gradient(90deg, rgba(196, 158, 87, 0.96), rgba(224, 188, 119, 0.92))",
          "--ticker-shell-border": "1px solid rgba(255, 255, 255, 0.08)",
          "--ticker-shell-radius": "999px",
          "--ticker-shell-padding-block": "0.45rem",
          "--ticker-shell-padding-inline": "0.8rem",
          "--ticker-item-color": "rgba(17, 12, 7, 0.92)",
          "--ticker-item-weight": "700",
        },
      },
      {
        label: "Hidden Rule",
        note: "Bare text line with almost no chrome.",
        meta: "borderless quiet line",
        tokens: {
          "--ticker-color": "rgba(127, 116, 103, 0.78)",
          "--ticker-size": "0.68rem",
          "--ticker-spacing": "0.16em",
          "--ticker-transform": "uppercase",
          "--ticker-gap": "1.05rem",
          "--ticker-border": "0 solid transparent",
        },
      },
      {
        label: "Mono Tape",
        note: "Square tickets with tighter desk-terminal energy.",
        meta: "boxed terminal ticker",
        tokens: {
          "--ticker-color": "var(--ink-2)",
          "--ticker-size": "0.66rem",
          "--ticker-spacing": "0.18em",
          "--ticker-transform": "uppercase",
          "--ticker-gap": "0.55rem",
          "--ticker-border": "0 solid transparent",
          "--ticker-item-bg": "rgba(255, 255, 255, 0.03)",
          "--ticker-item-border": "1px solid rgba(255, 255, 255, 0.08)",
          "--ticker-item-radius": "3px",
          "--ticker-item-padding-block": "0.34rem",
          "--ticker-item-padding-inline": "0.5rem",
          "--ticker-item-weight": "600",
        },
      },
      {
        label: "Warm Ink",
        note: "Soft framed strip with warm directory text.",
        meta: "warm publication strip",
        tokens: {
          "--ticker-color": "var(--ink-2)",
          "--ticker-size": "0.73rem",
          "--ticker-spacing": "0.05em",
          "--ticker-transform": "none",
          "--ticker-gap": "0.7rem",
          "--ticker-border": "0 solid transparent",
          "--ticker-shell-bg": "rgba(255, 255, 255, 0.02)",
          "--ticker-shell-border": "1px solid rgba(255, 255, 255, 0.04)",
          "--ticker-shell-radius": "14px",
          "--ticker-shell-padding-block": "0.4rem",
          "--ticker-shell-padding-inline": "0.55rem",
          "--ticker-item-padding-block": "0.2rem",
          "--ticker-item-padding-inline": "0.24rem",
        },
      },
      {
        label: "Bold Tape",
        note: "Large marked names inside bordered pills.",
        meta: "bold chip ticker",
        tokens: {
          "--ticker-color": "var(--ink-1)",
          "--ticker-size": "0.82rem",
          "--ticker-spacing": "0.06em",
          "--ticker-transform": "uppercase",
          "--ticker-gap": "0.7rem",
          "--ticker-border": "0 solid transparent",
          "--ticker-item-bg": "rgba(255, 255, 255, 0.03)",
          "--ticker-item-border": "1px solid rgba(196, 158, 87, 0.22)",
          "--ticker-item-radius": "999px",
          "--ticker-item-padding-block": "0.4rem",
          "--ticker-item-padding-inline": "0.8rem",
          "--ticker-item-weight": "700",
          "--ticker-item-shadow": "inset 0 0 0 1px rgba(255, 255, 255, 0.02)",
        },
      },
      {
        label: "Faded Strip",
        note: "Low-contrast reference line with restrained presence.",
        meta: "faint archive ribbon",
        tokens: {
          "--ticker-color": "rgba(127, 116, 103, 0.58)",
          "--ticker-size": "0.66rem",
          "--ticker-spacing": "0.18em",
          "--ticker-transform": "uppercase",
          "--ticker-gap": "1rem",
          "--ticker-border": "1px solid rgba(239, 232, 220, 0.03)",
        },
      },
      {
        label: "Double Border",
        note: "Ribbon becomes a fully framed strip plus lower rule.",
        meta: "double-framed ticker",
        tokens: {
          "--ticker-color": "var(--ink-2)",
          "--ticker-size": "0.71rem",
          "--ticker-spacing": "0.14em",
          "--ticker-transform": "uppercase",
          "--ticker-gap": "0.95rem",
          "--ticker-border": "1px solid rgba(255, 255, 255, 0.08)",
          "--ticker-shell-border": "1px solid rgba(255, 255, 255, 0.08)",
          "--ticker-shell-radius": "10px",
          "--ticker-shell-padding-block": "0.42rem",
          "--ticker-shell-padding-inline": "0.6rem",
        },
      },
      {
        label: "Accent Text",
        note: "Accent labels with signal dots instead of chips.",
        meta: "accent-dot ticker",
        tokens: {
          "--ticker-color": "var(--accent)",
          "--ticker-size": "0.7rem",
          "--ticker-spacing": "0.14em",
          "--ticker-transform": "uppercase",
          "--ticker-gap": "1rem",
          "--ticker-border": "0 solid transparent",
          "--ticker-item-color": "var(--accent)",
          "--ticker-item-gap": "0.38rem",
          "--ticker-item-dot-display": "block",
          "--ticker-item-dot-color": "var(--accent)",
          "--ticker-item-weight": "600",
        },
      },
    ],
  }),
  buildTokenGroup({
    id: "score-display",
    title: "12. Score Display",
    description: "Controls the score ring, number size, and overall score presentation on the results page.",
    renderPreview: renderScorePreview,
    options: [
      {
        label: "Default Ring",
        note: "Finished default with a quiet breakdown card under the dial.",
        meta: "default score ring",
        tokens: {
          "--score-ring-accent": "var(--accent)",
          "--score-ring-track": "rgba(255, 255, 255, 0.08)",
          "--score-ring-size": "min(112px, 34vw)",
          "--score-ring-inner-size": "73%",
          "--score-ring-margin": "0",
          "--score-ring-justify-self": "start",
          "--score-ring-border": "0 solid transparent",
          "--score-ring-shadow": "none",
          "--score-ring-sheen": "none",
          "--score-ring-inner-bg": "var(--page-bg)",
          "--score-ring-inner-border": "0 solid transparent",
          "--score-number-size": "clamp(2.1rem, 4vw, 2.7rem)",
          "--score-number-weight": "500",
          "--score-number-color": "var(--ink-1)",
          "--score-label-size": "0.58rem",
          "--score-label-weight": "600",
          "--score-label-spacing": "0.12em",
          "--score-label-transform": "uppercase",
          "--score-label-color": "var(--ink-3)",
          "--score-panel-columns": "112px minmax(0, 1fr)",
          "--score-panel-gap": "1rem",
          "--score-panel-align": "center",
          "--score-breakdown-bg": "rgba(255, 255, 255, 0.02)",
          "--score-breakdown-border": "1px solid rgba(255, 255, 255, 0.05)",
          "--score-breakdown-radius": "14px",
          "--score-breakdown-padding": "0.8rem",
        },
      },
      {
        label: "Compact Ring",
        note: "Two-column analyst card with a tighter dial and summary module.",
        meta: "compact score",
        tokens: {
          "--score-ring-accent": "var(--accent)",
          "--score-ring-track": "rgba(255, 255, 255, 0.06)",
          "--score-ring-size": "min(174px, 48vw)",
          "--score-ring-inner-size": "79%",
          "--score-ring-margin": "0",
          "--score-ring-justify-self": "start",
          "--score-number-size": "clamp(2.25rem, 5vw, 2.95rem)",
          "--score-number-weight": "600",
          "--score-label-size": "0.62rem",
          "--score-label-spacing": "0.16em",
          "--score-panel-columns": "minmax(0, 172px) minmax(0, 1fr)",
          "--score-panel-gap": "1rem",
          "--score-panel-align": "center",
          "--score-breakdown-bg": "rgba(255, 255, 255, 0.025)",
          "--score-breakdown-border": "1px solid rgba(255, 255, 255, 0.05)",
          "--score-breakdown-radius": "12px",
          "--score-breakdown-padding": "0.72rem",
          "--score-actions-justify": "flex-end",
          "--score-actions-padding-top": "0.2rem",
        },
      },
      {
        label: "Bold Number",
        note: "Billboard tile instead of a dial, with a proper summary block below.",
        meta: "bold score display",
        tokens: {
          "--score-ring-accent": "var(--accent)",
          "--score-ring-track": "transparent",
          "--score-ring-fill": "linear-gradient(180deg, rgba(196, 158, 87, 0.22), rgba(196, 158, 87, 0.08))",
          "--score-ring-size": "min(214px, 56vw)",
          "--score-ring-radius": "28px",
          "--score-ring-inner-size": "86%",
          "--score-ring-inner-radius": "22px",
          "--score-ring-border": "1px solid rgba(196, 158, 87, 0.26)",
          "--score-ring-shadow": "0 16px 28px rgba(0, 0, 0, 0.18)",
          "--score-ring-sheen": "linear-gradient(180deg, rgba(255, 255, 255, 0.1), transparent 52%)",
          "--score-ring-inner-bg": "rgba(20, 17, 14, 0.96)",
          "--score-ring-inner-border": "1px solid rgba(255, 255, 255, 0.06)",
          "--score-stack-gap": "0.38rem",
          "--score-number-size": "clamp(3.8rem, 8vw, 4.9rem)",
          "--score-number-weight": "800",
          "--score-number-color": "var(--accent)",
          "--score-number-spacing": "-0.07em",
          "--score-label-size": "0.58rem",
          "--score-label-color": "var(--accent)",
          "--score-label-bg": "rgba(196, 158, 87, 0.12)",
          "--score-label-border": "1px solid rgba(196, 158, 87, 0.24)",
          "--score-label-radius": "999px",
          "--score-label-padding": "0.18rem 0.46rem",
          "--score-label-spacing": "0.14em",
          "--score-panel-bg-layer": "linear-gradient(180deg, rgba(196, 158, 87, 0.05), transparent 72%)",
          "--score-breakdown-bg": "rgba(255, 255, 255, 0.02)",
          "--score-breakdown-border": "1px solid rgba(196, 158, 87, 0.12)",
          "--score-breakdown-radius": "14px",
          "--score-breakdown-padding": "0.72rem",
        },
      },
      {
        label: "Large Ring",
        note: "Full medallion hero with a finished spec card beneath it.",
        meta: "large score ring",
        tokens: {
          "--score-ring-accent": "var(--accent)",
          "--score-ring-track": "rgba(255, 255, 255, 0.1)",
          "--score-ring-size": "min(260px, 70vw)",
          "--score-ring-inner-size": "66%",
          "--score-ring-border": "1px solid rgba(196, 158, 87, 0.24)",
          "--score-ring-shadow": "0 0 0 12px rgba(196, 158, 87, 0.05), 0 20px 38px rgba(0, 0, 0, 0.26)",
          "--score-ring-sheen": "linear-gradient(145deg, rgba(255, 255, 255, 0.14), transparent 48%)",
          "--score-ring-inner-bg": "rgba(9, 8, 6, 0.96)",
          "--score-ring-inner-border": "1px solid rgba(255, 255, 255, 0.08)",
          "--score-number-size": "clamp(3rem, 7vw, 4.2rem)",
          "--score-number-weight": "400",
          "--score-label-bg": "rgba(255, 255, 255, 0.04)",
          "--score-label-border": "1px solid rgba(255, 255, 255, 0.06)",
          "--score-label-radius": "999px",
          "--score-label-padding": "0.12rem 0.38rem",
          "--score-panel-bg-layer": "radial-gradient(circle at top, rgba(196, 158, 87, 0.08), transparent 58%)",
          "--score-panel-shadow": "0 22px 42px rgba(0, 0, 0, 0.16)",
          "--score-breakdown-bg": "rgba(255, 255, 255, 0.03)",
          "--score-breakdown-border": "1px solid rgba(255, 255, 255, 0.06)",
          "--score-breakdown-radius": "16px",
          "--score-breakdown-padding": "0.82rem",
          "--score-actions-justify": "center",
        },
      },
      {
        label: "Muted Track",
        note: "Quiet split layout with subdued scoring and a restrained spec panel.",
        meta: "quieter track",
        tokens: {
          "--score-ring-accent": "rgba(196, 158, 87, 0.72)",
          "--score-ring-track": "rgba(255, 255, 255, 0.03)",
          "--score-ring-size": "min(176px, 48vw)",
          "--score-ring-inner-size": "75%",
          "--score-ring-margin": "0",
          "--score-ring-justify-self": "start",
          "--score-number-size": "clamp(2.7rem, 6vw, 3.4rem)",
          "--score-number-weight": "400",
          "--score-number-color": "var(--ink-2)",
          "--score-label-color": "var(--ink-2)",
          "--score-label-transform": "none",
          "--score-label-spacing": "0.02em",
          "--score-panel-columns": "minmax(0, 176px) minmax(0, 1fr)",
          "--score-panel-gap": "1rem",
          "--score-panel-align": "center",
          "--score-breakdown-bg": "rgba(255, 255, 255, 0.015)",
          "--score-breakdown-border": "1px solid rgba(255, 255, 255, 0.03)",
          "--score-breakdown-radius": "14px",
          "--score-breakdown-padding": "0.74rem",
          "--score-actions-justify": "flex-end",
        },
      },
      {
        label: "White Track",
        note: "Analytical board treatment with a framed dial and finished right-hand metrics.",
        meta: "bright track",
        tokens: {
          "--score-ring-accent": "var(--accent)",
          "--score-ring-track": "rgba(255, 255, 255, 0.16)",
          "--score-ring-size": "min(228px, 62vw)",
          "--score-ring-inner-size": "71%",
          "--score-ring-border": "1px solid rgba(255, 255, 255, 0.12)",
          "--score-ring-inner-border": "1px solid rgba(255, 255, 255, 0.08)",
          "--score-number-size": "clamp(2.8rem, 6vw, 3.55rem)",
          "--score-number-weight": "600",
          "--score-label-spacing": "0.14em",
          "--score-panel-gap": "0.9rem",
          "--score-panel-bg-layer": "linear-gradient(180deg, rgba(255, 255, 255, 0.05), transparent 78%)",
          "--score-breakdown-bg": "rgba(255, 255, 255, 0.05)",
          "--score-breakdown-border": "1px solid rgba(255, 255, 255, 0.1)",
          "--score-breakdown-radius": "14px",
          "--score-breakdown-padding": "0.78rem",
          "--score-actions-justify": "center",
        },
      },
      {
        label: "Thin Number",
        note: "Editorial score card with lighter type and a softer written readout.",
        meta: "thin score",
        tokens: {
          "--score-ring-accent": "var(--accent)",
          "--score-ring-track": "rgba(255, 255, 255, 0.08)",
          "--score-ring-size": "min(220px, 60vw)",
          "--score-ring-inner-size": "74%",
          "--score-ring-margin": "0 0 0.75rem",
          "--score-ring-justify-self": "start",
          "--score-number-size": "clamp(3rem, 7vw, 3.9rem)",
          "--score-number-weight": "300",
          "--score-label-size": "0.82rem",
          "--score-label-transform": "none",
          "--score-label-spacing": "0.02em",
          "--score-panel-bg-layer": "linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent 76%)",
          "--score-breakdown-bg": "rgba(255, 255, 255, 0.02)",
          "--score-breakdown-border": "1px solid rgba(255, 255, 255, 0.04)",
          "--score-breakdown-radius": "14px",
          "--score-breakdown-padding": "0.78rem",
        },
      },
      {
        label: "Success Ring",
        note: "Verdict-style success panel with a green dial and tinted summary module.",
        meta: "green score ring",
        tokens: {
          "--score-ring-accent": "var(--success)",
          "--score-ring-track": "rgba(255, 255, 255, 0.07)",
          "--score-ring-size": "min(220px, 60vw)",
          "--score-ring-inner-size": "72%",
          "--score-ring-shadow": "0 0 0 10px rgba(126, 176, 141, 0.08)",
          "--score-ring-inner-bg": "rgba(10, 18, 13, 0.96)",
          "--score-ring-inner-border": "1px solid rgba(126, 176, 141, 0.18)",
          "--score-number-color": "var(--success)",
          "--score-number-size": "clamp(2.7rem, 6vw, 3.45rem)",
          "--score-label-color": "rgba(126, 176, 141, 0.8)",
          "--score-panel-bg-layer": "radial-gradient(circle at top, rgba(126, 176, 141, 0.08), transparent 60%)",
          "--score-breakdown-bg": "rgba(126, 176, 141, 0.06)",
          "--score-breakdown-border": "1px solid rgba(126, 176, 141, 0.14)",
          "--score-breakdown-radius": "14px",
          "--score-breakdown-padding": "0.78rem",
        },
      },
      {
        label: "Ink Ring",
        note: "Docket-card treatment with an ivory plate and a proper side module.",
        meta: "neutral score ring",
        tokens: {
          "--score-ring-accent": "var(--ink-1)",
          "--score-ring-track": "transparent",
          "--score-ring-fill": "linear-gradient(180deg, rgba(239, 232, 220, 0.98), rgba(223, 215, 200, 0.92))",
          "--score-ring-size": "min(186px, 50vw)",
          "--score-ring-radius": "22px",
          "--score-ring-inner-size": "70%",
          "--score-ring-inner-radius": "16px",
          "--score-ring-border": "1px solid rgba(255, 255, 255, 0.12)",
          "--score-ring-shadow": "0 16px 28px rgba(0, 0, 0, 0.18)",
          "--score-ring-margin": "0",
          "--score-ring-justify-self": "start",
          "--score-ring-inner-border": "1px solid rgba(255, 255, 255, 0.08)",
          "--score-ring-inner-bg": "rgba(18, 16, 14, 0.96)",
          "--score-number-weight": "650",
          "--score-label-size": "0.68rem",
          "--score-label-spacing": "0.16em",
          "--score-label-bg": "rgba(255, 255, 255, 0.05)",
          "--score-label-border": "1px solid rgba(255, 255, 255, 0.08)",
          "--score-label-radius": "4px",
          "--score-label-padding": "0.16rem 0.38rem",
          "--score-panel-columns": "minmax(0, 186px) minmax(0, 1fr)",
          "--score-panel-gap": "1rem",
          "--score-panel-align": "center",
          "--score-panel-bg-layer": "linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent 76%)",
          "--score-breakdown-bg": "rgba(255, 255, 255, 0.03)",
          "--score-breakdown-border": "1px solid rgba(255, 255, 255, 0.08)",
          "--score-breakdown-radius": "10px",
          "--score-breakdown-padding": "0.78rem",
          "--score-actions-justify": "flex-end",
        },
      },
      {
        label: "Oversized",
        note: "Hero medallion with a centered spec block and finished medal styling.",
        meta: "oversized score",
        tokens: {
          "--score-ring-accent": "var(--accent)",
          "--score-ring-track": "rgba(255, 255, 255, 0.08)",
          "--score-ring-size": "min(290px, 76vw)",
          "--score-ring-inner-size": "58%",
          "--score-ring-border": "1px solid rgba(196, 158, 87, 0.32)",
          "--score-ring-shadow": "0 0 0 16px rgba(255, 255, 255, 0.02), 0 24px 44px rgba(0, 0, 0, 0.3)",
          "--score-ring-sheen": "linear-gradient(145deg, rgba(255, 255, 255, 0.18), transparent 44%)",
          "--score-ring-inner-border": "1px solid rgba(255, 255, 255, 0.1)",
          "--score-number-size": "clamp(3.5rem, 8vw, 4.8rem)",
          "--score-number-weight": "400",
          "--score-label-size": "0.68rem",
          "--score-label-spacing": "0.18em",
          "--score-label-bg": "rgba(255, 255, 255, 0.05)",
          "--score-label-border": "1px solid rgba(196, 158, 87, 0.2)",
          "--score-label-radius": "999px",
          "--score-label-padding": "0.14rem 0.42rem",
          "--score-panel-bg-layer": "radial-gradient(circle at top, rgba(196, 158, 87, 0.1), transparent 62%)",
          "--score-panel-shadow": "0 28px 52px rgba(0, 0, 0, 0.18)",
          "--score-breakdown-bg": "rgba(255, 255, 255, 0.03)",
          "--score-breakdown-border": "1px solid rgba(255, 255, 255, 0.08)",
          "--score-breakdown-radius": "16px",
          "--score-breakdown-padding": "0.84rem",
          "--score-actions-justify": "center",
        },
      },
      {
        label: "Warning Ring",
        note: "Amber warning dossier with a tinted summary card beside the gauge.",
        meta: "amber score ring",
        tokens: {
          "--score-ring-accent": "var(--warning)",
          "--score-ring-track": "rgba(255, 255, 255, 0.07)",
          "--score-ring-size": "min(176px, 48vw)",
          "--score-ring-inner-size": "72%",
          "--score-ring-shadow": "0 0 0 10px rgba(209, 163, 94, 0.08)",
          "--score-ring-inner-bg": "rgba(24, 18, 9, 0.96)",
          "--score-ring-inner-border": "1px solid rgba(209, 163, 94, 0.18)",
          "--score-ring-margin": "0",
          "--score-ring-justify-self": "start",
          "--score-number-color": "var(--warning)",
          "--score-number-weight": "500",
          "--score-label-color": "rgba(209, 163, 94, 0.82)",
          "--score-panel-columns": "minmax(0, 176px) minmax(0, 1fr)",
          "--score-panel-gap": "1rem",
          "--score-panel-align": "center",
          "--score-panel-bg-layer": "radial-gradient(circle at top, rgba(209, 163, 94, 0.08), transparent 60%)",
          "--score-breakdown-bg": "rgba(209, 163, 94, 0.06)",
          "--score-breakdown-border": "1px solid rgba(209, 163, 94, 0.16)",
          "--score-breakdown-radius": "14px",
          "--score-breakdown-padding": "0.78rem",
          "--score-actions-justify": "flex-end",
        },
      },
      {
        label: "Minimal Ring",
        note: "Small metric tile paired with a compact right-hand summary card.",
        meta: "minimal score",
        tokens: {
          "--score-ring-accent": "var(--accent)",
          "--score-ring-track": "transparent",
          "--score-ring-fill": "linear-gradient(180deg, rgba(196, 158, 87, 0.18), rgba(196, 158, 87, 0.05))",
          "--score-ring-size": "min(150px, 42vw)",
          "--score-ring-radius": "18px",
          "--score-ring-inner-size": "82%",
          "--score-ring-inner-radius": "12px",
          "--score-ring-border": "1px solid rgba(255, 255, 255, 0.06)",
          "--score-ring-margin": "0",
          "--score-ring-justify-self": "start",
          "--score-stack-gap": "0.3rem",
          "--score-number-size": "clamp(2rem, 4vw, 2.4rem)",
          "--score-number-weight": "700",
          "--score-label-size": "0.56rem",
          "--score-label-spacing": "0.18em",
          "--score-label-transform": "uppercase",
          "--score-label-bg": "rgba(255, 255, 255, 0.05)",
          "--score-label-border": "1px solid rgba(255, 255, 255, 0.08)",
          "--score-label-radius": "4px",
          "--score-label-padding": "0.12rem 0.3rem",
          "--score-panel-columns": "minmax(0, 150px) minmax(0, 1fr)",
          "--score-panel-gap": "0.9rem",
          "--score-panel-align": "center",
          "--score-breakdown-bg": "rgba(255, 255, 255, 0.03)",
          "--score-breakdown-border": "1px solid rgba(255, 255, 255, 0.06)",
          "--score-breakdown-radius": "10px",
          "--score-breakdown-padding": "0.62rem",
          "--score-actions-justify": "flex-end",
        },
      },
    ],
  }),
  buildTokenGroup({
    id: "severity-badges",
    title: "13. Severity/Status Badges",
    description: "Controls the shape, size, and typography of status pills across results and bank fit panels.",
    renderPreview: renderBadgePreview,
    options: [
      {
        label: "Default Pill",
        note: "Standard filled lozenges with light tint and clear semantic color.",
        meta: "default badges",
        tokens: {
          "--badge-radius": "var(--radius-pill)",
          "--badge-size": "0.68rem",
          "--badge-weight": "600",
          "--badge-spacing": "0.09em",
          "--badge-transform": "uppercase",
          "--badge-padding-block": "0.26rem",
          "--badge-padding-inline": "0.56rem",
        },
      },
      {
        label: "Sharp Tag",
        note: "Squared tags with firmer borders and a sharper newsroom read.",
        meta: "square badges",
        tokens: {
          "--badge-radius": "2px",
          "--badge-size": "0.66rem",
          "--badge-weight": "700",
          "--badge-spacing": "0.12em",
          "--badge-transform": "uppercase",
          "--badge-padding-block": "0.24rem",
          "--badge-padding-inline": "0.48rem",
          "--badge-danger-bg": "rgba(207, 114, 94, 0.08)",
          "--badge-danger-border": "rgba(207, 114, 94, 0.42)",
          "--badge-warning-bg": "rgba(209, 163, 94, 0.08)",
          "--badge-warning-border": "rgba(209, 163, 94, 0.42)",
          "--badge-success-bg": "rgba(126, 176, 141, 0.08)",
          "--badge-success-border": "rgba(126, 176, 141, 0.42)",
        },
      },
      {
        label: "Soft Chip",
        note: "Broader soft chips with more fill and less edge tension.",
        meta: "soft chip badges",
        tokens: {
          "--badge-radius": "10px",
          "--badge-size": "0.7rem",
          "--badge-weight": "600",
          "--badge-spacing": "0.05em",
          "--badge-padding-block": "0.32rem",
          "--badge-padding-inline": "0.62rem",
          "--badge-danger-bg": "rgba(207, 114, 94, 0.2)",
          "--badge-warning-bg": "rgba(209, 163, 94, 0.2)",
          "--badge-success-bg": "rgba(126, 176, 141, 0.2)",
        },
      },
      {
        label: "Large Badge",
        note: "More prominent severity chips with broader padding and lift.",
        meta: "large badges",
        tokens: {
          "--badge-radius": "var(--radius-pill)",
          "--badge-size": "0.78rem",
          "--badge-weight": "700",
          "--badge-spacing": "0.06em",
          "--badge-padding-block": "0.38rem",
          "--badge-padding-inline": "0.76rem",
          "--badge-shadow": "0 10px 18px rgba(0, 0, 0, 0.18)",
        },
      },
      {
        label: "Micro Tag",
        note: "Dense compact labels that feel like system metadata.",
        meta: "micro badges",
        tokens: {
          "--badge-radius": "var(--radius-sm)",
          "--badge-size": "0.56rem",
          "--badge-weight": "700",
          "--badge-spacing": "0.16em",
          "--badge-transform": "uppercase",
          "--badge-padding-block": "0.18rem",
          "--badge-padding-inline": "0.36rem",
          "--badge-danger-bg": "transparent",
          "--badge-warning-bg": "transparent",
          "--badge-success-bg": "transparent",
          "--badge-danger-border": "rgba(207, 114, 94, 0.32)",
          "--badge-warning-border": "rgba(209, 163, 94, 0.32)",
          "--badge-success-border": "rgba(126, 176, 141, 0.32)",
        },
      },
      {
        label: "Sentence Badge",
        note: "Softer mixed-case treatment that reads more editorial than system.",
        meta: "sentence case badges",
        tokens: {
          "--badge-radius": "var(--radius-pill)",
          "--badge-size": "0.68rem",
          "--badge-weight": "600",
          "--badge-spacing": "0.02em",
          "--badge-transform": "none",
          "--badge-padding-block": "0.28rem",
          "--badge-padding-inline": "0.6rem",
        },
      },
      {
        label: "Notched Label",
        note: "Outline-forward labels with a leading status dot.",
        meta: "notched badges",
        tokens: {
          "--badge-radius": "0px",
          "--badge-size": "0.64rem",
          "--badge-weight": "700",
          "--badge-spacing": "0.14em",
          "--badge-transform": "uppercase",
          "--badge-padding-block": "0.22rem",
          "--badge-padding-inline": "0.44rem",
          "--badge-gap": "0.34rem",
          "--badge-dot-display": "inline-block",
          "--badge-danger-bg": "transparent",
          "--badge-warning-bg": "transparent",
          "--badge-success-bg": "transparent",
          "--badge-danger-border": "rgba(207, 114, 94, 0.44)",
          "--badge-warning-border": "rgba(209, 163, 94, 0.44)",
          "--badge-success-border": "rgba(126, 176, 141, 0.44)",
        },
      },
      {
        label: "Wide Pill",
        note: "Spacious pills with high letter-spacing and more UI presence.",
        meta: "wide badges",
        tokens: {
          "--badge-radius": "var(--radius-pill)",
          "--badge-size": "0.66rem",
          "--badge-weight": "600",
          "--badge-spacing": "0.18em",
          "--badge-transform": "uppercase",
          "--badge-padding-block": "0.3rem",
          "--badge-padding-inline": "0.9rem",
        },
      },
      {
        label: "Bold Slab",
        note: "Solid slabs with dark ink text for the strongest contrast.",
        meta: "slab badges",
        tokens: {
          "--badge-radius": "4px",
          "--badge-size": "0.72rem",
          "--badge-weight": "800",
          "--badge-spacing": "0.04em",
          "--badge-transform": "uppercase",
          "--badge-padding-block": "0.3rem",
          "--badge-padding-inline": "0.62rem",
          "--badge-shadow": "0 8px 16px rgba(0, 0, 0, 0.16)",
          "--badge-danger-bg": "var(--danger)",
          "--badge-danger-border": "var(--danger)",
          "--badge-danger-color": "#190d0a",
          "--badge-warning-bg": "var(--warning)",
          "--badge-warning-border": "var(--warning)",
          "--badge-warning-color": "#1b1307",
          "--badge-success-bg": "var(--success)",
          "--badge-success-border": "var(--success)",
          "--badge-success-color": "#0b1710",
        },
      },
      {
        label: "Thin Line",
        note: "Minimal outline badges with almost no fill and lighter weight.",
        meta: "thin badges",
        tokens: {
          "--badge-radius": "var(--radius-pill)",
          "--badge-size": "0.66rem",
          "--badge-weight": "500",
          "--badge-spacing": "0.1em",
          "--badge-transform": "uppercase",
          "--badge-padding-block": "0.2rem",
          "--badge-padding-inline": "0.46rem",
          "--badge-danger-bg": "transparent",
          "--badge-warning-bg": "transparent",
          "--badge-success-bg": "transparent",
          "--badge-danger-border": "rgba(207, 114, 94, 0.22)",
          "--badge-warning-border": "rgba(209, 163, 94, 0.22)",
          "--badge-success-border": "rgba(126, 176, 141, 0.22)",
        },
      },
      {
        label: "Capsule",
        note: "Rounded capsules with a subtle leading dot and softer fill.",
        meta: "capsule badges",
        tokens: {
          "--badge-radius": "12px",
          "--badge-size": "0.68rem",
          "--badge-weight": "600",
          "--badge-spacing": "0.06em",
          "--badge-transform": "uppercase",
          "--badge-padding-block": "0.3rem",
          "--badge-padding-inline": "0.6rem",
          "--badge-gap": "0.3rem",
          "--badge-dot-display": "inline-block",
          "--badge-danger-bg": "rgba(207, 114, 94, 0.1)",
          "--badge-warning-bg": "rgba(209, 163, 94, 0.1)",
          "--badge-success-bg": "rgba(126, 176, 141, 0.1)",
        },
      },
      {
        label: "Lowercase Tag",
        note: "Small lowercase labels with restrained tone and lighter presence.",
        meta: "lowercase badges",
        tokens: {
          "--badge-radius": "var(--radius-sm)",
          "--badge-size": "0.68rem",
          "--badge-weight": "600",
          "--badge-spacing": "0.02em",
          "--badge-transform": "lowercase",
          "--badge-padding-block": "0.24rem",
          "--badge-padding-inline": "0.46rem",
          "--badge-danger-bg": "rgba(207, 114, 94, 0.09)",
          "--badge-warning-bg": "rgba(209, 163, 94, 0.09)",
          "--badge-success-bg": "rgba(126, 176, 141, 0.09)",
        },
      },
    ],
  }),
  buildTokenGroup({
    id: "progress-bars",
    title: "14. Category Progress Bars",
    description: "Controls the metric progress bars on the results page — height, radius, and track treatment.",
    renderPreview: renderProgressPreview,
    options: [
      {
        label: "Default Bar",
        note: "Rounded ledger bars with restrained size and standard semantics.",
        meta: "default progress",
        tokens: {
          "--progress-height": "0.4rem",
          "--progress-radius": "999px",
          "--progress-track-bg": "rgba(255, 255, 255, 0.08)",
          "--progress-success-fill": "var(--success)",
          "--progress-warning-fill": "var(--warning)",
        },
      },
      {
        label: "Thick Bar",
        note: "Chunkier dashboard bars with larger labels and values.",
        meta: "thick progress",
        tokens: {
          "--progress-height": "0.65rem",
          "--progress-radius": "999px",
          "--progress-track-bg": "rgba(255, 255, 255, 0.1)",
          "--progress-label-size": "0.9rem",
          "--progress-label-weight": "600",
          "--progress-value-size": "1.08rem",
          "--progress-value-weight": "700",
          "--progress-row-gap": "1rem",
        },
      },
      {
        label: "Slim Line",
        note: "Thin, refined bars with compact supporting typography.",
        meta: "slim progress",
        tokens: {
          "--progress-height": "0.2rem",
          "--progress-radius": "999px",
          "--progress-track-bg": "rgba(255, 255, 255, 0.06)",
          "--progress-label-size": "0.76rem",
          "--progress-value-size": "0.9rem",
          "--progress-row-gap": "0.6rem",
        },
      },
      {
        label: "Square Bar",
        note: "Hard-edge bars that feel more tabular and data-dense.",
        meta: "square progress",
        tokens: {
          "--progress-height": "0.42rem",
          "--progress-radius": "0px",
          "--progress-track-bg": "rgba(255, 255, 255, 0.08)",
          "--progress-track-border": "1px solid rgba(255, 255, 255, 0.08)",
          "--progress-label-weight": "600",
        },
      },
      {
        label: "Soft Square",
        note: "Boxier bars with just enough rounding to stay polished.",
        meta: "soft square progress",
        tokens: {
          "--progress-height": "0.48rem",
          "--progress-radius": "4px",
          "--progress-track-bg": "rgba(255, 255, 255, 0.08)",
          "--progress-track-border": "1px solid rgba(255, 255, 255, 0.05)",
          "--progress-track-shadow": "inset 0 1px 0 rgba(255, 255, 255, 0.03)",
        },
      },
      {
        label: "Bold Track",
        note: "Framed tracks with clearer boundaries and heavier read.",
        meta: "bold track progress",
        tokens: {
          "--progress-height": "0.5rem",
          "--progress-radius": "999px",
          "--progress-track-bg": "rgba(255, 255, 255, 0.16)",
          "--progress-track-border": "1px solid rgba(255, 255, 255, 0.08)",
          "--progress-label-weight": "600",
          "--progress-value-weight": "700",
        },
      },
      {
        label: "Ghost Track",
        note: "Minimal track where the fill does almost all of the visual work.",
        meta: "ghost progress",
        tokens: {
          "--progress-height": "0.38rem",
          "--progress-radius": "999px",
          "--progress-track-bg": "rgba(255, 255, 255, 0.03)",
          "--progress-fill-shadow": "0 0 12px rgba(126, 176, 141, 0.16)",
          "--progress-success-fill": "linear-gradient(90deg, rgba(126, 176, 141, 0.95), rgba(126, 176, 141, 0.46))",
          "--progress-warning-fill": "linear-gradient(90deg, rgba(209, 163, 94, 0.95), rgba(209, 163, 94, 0.46))",
        },
      },
      {
        label: "Heavy Slab",
        note: "Big slab bars with strong framing and denser, louder metrics.",
        meta: "slab progress",
        tokens: {
          "--progress-height": "0.76rem",
          "--progress-radius": "2px",
          "--progress-track-bg": "rgba(255, 255, 255, 0.12)",
          "--progress-track-border": "1px solid rgba(255, 255, 255, 0.08)",
          "--progress-track-shadow": "inset 0 1px 0 rgba(255, 255, 255, 0.04)",
          "--progress-fill-shadow": "inset 0 -1px 0 rgba(0, 0, 0, 0.18)",
          "--progress-label-size": "0.82rem",
          "--progress-value-size": "1.02rem",
          "--progress-value-weight": "700",
        },
      },
      {
        label: "Hairline",
        note: "Ultra-thin signal bars that recede behind the numeric values.",
        meta: "hairline progress",
        tokens: {
          "--progress-height": "0.14rem",
          "--progress-radius": "999px",
          "--progress-track-bg": "rgba(255, 255, 255, 0.05)",
          "--progress-label-size": "0.74rem",
          "--progress-value-size": "0.88rem",
          "--progress-row-gap": "0.7rem",
        },
      },
      {
        label: "Medium Round",
        note: "Balanced mid-weight bars with slightly boxier corners.",
        meta: "medium progress",
        tokens: {
          "--progress-height": "0.54rem",
          "--progress-radius": "6px",
          "--progress-track-bg": "rgba(255, 255, 255, 0.08)",
          "--progress-track-border": "1px solid rgba(255, 255, 255, 0.05)",
          "--progress-label-weight": "600",
        },
      },
      {
        label: "Warm Track",
        note: "Warmer finance-desk palette with more editorial color movement.",
        meta: "warm progress",
        tokens: {
          "--progress-height": "0.44rem",
          "--progress-radius": "999px",
          "--progress-track-bg": "rgba(239, 232, 220, 0.1)",
          "--progress-success-fill": "linear-gradient(90deg, var(--accent), var(--success))",
          "--progress-warning-fill": "linear-gradient(90deg, var(--warning), #e0bc77)",
          "--progress-fill-shadow": "0 0 8px rgba(196, 158, 87, 0.16)",
        },
      },
      {
        label: "Ticker Bar",
        note: "Extra-thick bars that feel like compact dashboard gauges.",
        meta: "wide progress",
        tokens: {
          "--progress-height": "0.82rem",
          "--progress-radius": "999px",
          "--progress-track-bg": "rgba(255, 255, 255, 0.08)",
          "--progress-track-border": "1px solid rgba(196, 158, 87, 0.22)",
          "--progress-success-fill": "linear-gradient(90deg, var(--accent), var(--success))",
          "--progress-warning-fill": "linear-gradient(90deg, var(--warning), var(--accent))",
          "--progress-fill-shadow": "inset 0 -1px 0 rgba(0, 0, 0, 0.18)",
          "--progress-label-size": "0.8rem",
          "--progress-value-size": "1.05rem",
          "--progress-value-weight": "700",
        },
      },
    ],
  }),
  buildTokenGroup({
    id: "issue-cards",
    title: "15. Issue Cards",
    description: "Controls the border, background, padding, and radius of critical and warning issue cards on the results page.",
    renderPreview: renderIssuePreview,
    options: [
      {
        label: "Default Card",
        note: "Standard framed issue card with restrained border color and no rail.",
        meta: "default issue cards",
        tokens: {
          "--issue-bg": "rgba(255, 255, 255, 0.02)",
          "--issue-radius": "var(--radius-md)",
          "--issue-padding": "1rem",
          "--issue-gap": "0.7rem",
          "--issue-border-critical": "rgba(207, 114, 94, 0.32)",
          "--issue-border-warning": "rgba(209, 163, 94, 0.35)",
          "--issue-critical-bg": "rgba(255, 255, 255, 0.02)",
          "--issue-warning-bg": "rgba(255, 255, 255, 0.02)",
        },
      },
      {
        label: "Sharp Card",
        note: "Sharper memo-card treatment with a visible severity rail.",
        meta: "sharp issue cards",
        tokens: {
          "--issue-radius": "2px",
          "--issue-padding": "1rem",
          "--issue-gap": "0.62rem",
          "--issue-rail-width": "4px",
          "--issue-title-weight": "650",
          "--issue-border-critical": "rgba(207, 114, 94, 0.38)",
          "--issue-border-warning": "rgba(209, 163, 94, 0.38)",
          "--issue-critical-bg": "rgba(255, 255, 255, 0.02)",
          "--issue-warning-bg": "rgba(255, 255, 255, 0.02)",
        },
      },
      {
        label: "Soft Card",
        note: "Rounder, softer containers with more fill and lower border emphasis.",
        meta: "soft issue cards",
        tokens: {
          "--issue-radius": "18px",
          "--issue-padding": "1.12rem",
          "--issue-gap": "0.74rem",
          "--issue-card-shadow": "0 12px 24px rgba(0, 0, 0, 0.14)",
          "--issue-border-critical": "rgba(207, 114, 94, 0.22)",
          "--issue-border-warning": "rgba(209, 163, 94, 0.22)",
          "--issue-critical-bg": "rgba(207, 114, 94, 0.08)",
          "--issue-warning-bg": "rgba(209, 163, 94, 0.08)",
        },
      },
      {
        label: "Bold Border",
        note: "High-emphasis issue treatment with a stronger rail and stronger stroke.",
        meta: "bold border issues",
        tokens: {
          "--issue-radius": "var(--radius-md)",
          "--issue-padding": "1rem",
          "--issue-gap": "0.72rem",
          "--issue-rail-width": "4px",
          "--issue-card-shadow": "0 10px 22px rgba(0, 0, 0, 0.16)",
          "--issue-title-size": "1.06rem",
          "--issue-title-weight": "700",
          "--issue-border-critical": "rgba(207, 114, 94, 0.58)",
          "--issue-border-warning": "rgba(209, 163, 94, 0.58)",
        },
      },
      {
        label: "Subtle Card",
        note: "Low-noise issue card where copy leads and framing recedes.",
        meta: "subtle issue cards",
        tokens: {
          "--issue-radius": "var(--radius-md)",
          "--issue-padding": "1rem",
          "--issue-gap": "0.66rem",
          "--issue-border-critical": "rgba(207, 114, 94, 0.16)",
          "--issue-border-warning": "rgba(209, 163, 94, 0.18)",
          "--issue-critical-bg": "rgba(255, 255, 255, 0.01)",
          "--issue-warning-bg": "rgba(255, 255, 255, 0.01)",
          "--issue-title-weight": "500",
        },
      },
      {
        label: "Filled Card",
        note: "Tint-led severity cards with less reliance on border contrast.",
        meta: "filled issue cards",
        tokens: {
          "--issue-radius": "var(--radius-md)",
          "--issue-padding": "1rem",
          "--issue-gap": "0.68rem",
          "--issue-border-critical": "rgba(207, 114, 94, 0.2)",
          "--issue-border-warning": "rgba(209, 163, 94, 0.22)",
          "--issue-critical-bg": "rgba(207, 114, 94, 0.1)",
          "--issue-warning-bg": "rgba(209, 163, 94, 0.1)",
        },
      },
      {
        label: "Tight Card",
        note: "Compressed technical treatment with tighter spacing and a slimmer rail.",
        meta: "tight issue cards",
        tokens: {
          "--issue-radius": "var(--radius-sm)",
          "--issue-padding": "0.78rem",
          "--issue-gap": "0.5rem",
          "--issue-rail-width": "3px",
          "--issue-title-size": "0.94rem",
          "--issue-title-weight": "600",
          "--issue-border-critical": "rgba(207, 114, 94, 0.34)",
          "--issue-border-warning": "rgba(209, 163, 94, 0.34)",
        },
      },
      {
        label: "Wide Card",
        note: "More memo-like spacing with broader paddings and larger titles.",
        meta: "spacious issue cards",
        tokens: {
          "--issue-radius": "var(--radius-lg)",
          "--issue-padding": "1.35rem",
          "--issue-gap": "0.9rem",
          "--issue-title-size": "1.12rem",
          "--issue-title-weight": "600",
          "--issue-border-critical": "rgba(207, 114, 94, 0.28)",
          "--issue-border-warning": "rgba(209, 163, 94, 0.3)",
        },
      },
      {
        label: "Ghost Card",
        note: "Border-only dossier card with no fill and stronger outline contrast.",
        meta: "ghost issue cards",
        tokens: {
          "--issue-radius": "var(--radius-md)",
          "--issue-padding": "1rem",
          "--issue-gap": "0.7rem",
          "--issue-border-critical": "rgba(207, 114, 94, 0.44)",
          "--issue-border-warning": "rgba(209, 163, 94, 0.46)",
          "--issue-critical-bg": "transparent",
          "--issue-warning-bg": "transparent",
        },
      },
      {
        label: "Warm Fill",
        note: "Warmer severity surfaces that feel more editorial than dashboard-like.",
        meta: "warm filled issues",
        tokens: {
          "--issue-radius": "var(--radius-md)",
          "--issue-padding": "1rem",
          "--issue-gap": "0.7rem",
          "--issue-border-critical": "rgba(207, 114, 94, 0.24)",
          "--issue-border-warning": "rgba(209, 163, 94, 0.26)",
          "--issue-critical-bg": "rgba(207, 114, 94, 0.06)",
          "--issue-warning-bg": "rgba(209, 163, 94, 0.08)",
          "--issue-card-shadow": "0 8px 18px rgba(0, 0, 0, 0.12)",
        },
      },
      {
        label: "Notched Card",
        note: "Square dossier card with stronger rail and uppercase title.",
        meta: "notched issue cards",
        tokens: {
          "--issue-radius": "0px",
          "--issue-padding": "1rem",
          "--issue-gap": "0.62rem",
          "--issue-rail-width": "5px",
          "--issue-title-size": "0.96rem",
          "--issue-title-weight": "700",
          "--issue-title-spacing": "0.04em",
          "--issue-title-transform": "uppercase",
          "--issue-border-critical": "rgba(207, 114, 94, 0.4)",
          "--issue-border-warning": "rgba(209, 163, 94, 0.4)",
        },
      },
      {
        label: "Heavy Card",
        note: "Most emphatic option with deeper fill, thicker rail, and stronger lift.",
        meta: "heavy issue cards",
        tokens: {
          "--issue-radius": "var(--radius-sm)",
          "--issue-padding": "1.12rem",
          "--issue-gap": "0.78rem",
          "--issue-rail-width": "6px",
          "--issue-card-shadow": "0 16px 30px rgba(0, 0, 0, 0.2)",
          "--issue-title-size": "1.08rem",
          "--issue-title-weight": "700",
          "--issue-border-critical": "rgba(207, 114, 94, 0.52)",
          "--issue-border-warning": "rgba(209, 163, 94, 0.52)",
          "--issue-critical-bg": "rgba(207, 114, 94, 0.11)",
          "--issue-warning-bg": "rgba(209, 163, 94, 0.11)",
        },
      },
    ],
  }),
  buildTokenGroup({
    id: "rewrite-cards",
    title: "16. Before/After Rewrites",
    description: "Controls the comparison cards that show original vs improved resume bullet points.",
    renderPreview: renderRewritePreview,
    options: [
      {
        label: "Default Diff",
        note: "Balanced before/after diff with soft tint and minimal label chrome.",
        meta: "default rewrites",
        tokens: {
          "--rewrite-radius": "var(--radius-sm)",
          "--rewrite-gap": "0.75rem",
          "--rewrite-padding": "0.85rem",
          "--rewrite-before-bg": "rgba(207, 114, 94, 0.08)",
          "--rewrite-after-bg": "rgba(126, 176, 141, 0.09)",
          "--rewrite-before-border": "1px solid rgba(207, 114, 94, 0.18)",
          "--rewrite-after-border": "1px solid rgba(126, 176, 141, 0.18)",
          "--rewrite-label-color": "var(--ink-3)",
        },
      },
      {
        label: "Sharp Diff",
        note: "Square comparison blocks with clearer label framing.",
        meta: "sharp rewrites",
        tokens: {
          "--rewrite-radius": "0px",
          "--rewrite-padding": "0.82rem",
          "--rewrite-before-bg": "rgba(207, 114, 94, 0.08)",
          "--rewrite-after-bg": "rgba(126, 176, 141, 0.09)",
          "--rewrite-before-border": "1px solid rgba(207, 114, 94, 0.22)",
          "--rewrite-after-border": "1px solid rgba(126, 176, 141, 0.22)",
          "--rewrite-label-border": "1px solid rgba(255, 255, 255, 0.08)",
          "--rewrite-label-radius": "0px",
          "--rewrite-label-padding": "0.16rem 0.34rem",
        },
      },
      {
        label: "Soft Diff",
        note: "Rounder comparison cards with pill labels and softer contrast.",
        meta: "soft rewrites",
        tokens: {
          "--rewrite-radius": "14px",
          "--rewrite-gap": "0.8rem",
          "--rewrite-padding": "0.92rem",
          "--rewrite-before-bg": "rgba(207, 114, 94, 0.08)",
          "--rewrite-after-bg": "rgba(126, 176, 141, 0.09)",
          "--rewrite-before-border": "1px solid rgba(207, 114, 94, 0.16)",
          "--rewrite-after-border": "1px solid rgba(126, 176, 141, 0.16)",
          "--rewrite-label-bg": "rgba(255, 255, 255, 0.04)",
          "--rewrite-label-radius": "999px",
          "--rewrite-label-padding": "0.18rem 0.42rem",
        },
      },
      {
        label: "Bold Tint",
        note: "Heavier filled contrast that makes the rewrite difference feel louder.",
        meta: "bold rewrites",
        tokens: {
          "--rewrite-radius": "var(--radius-sm)",
          "--rewrite-padding": "0.88rem",
          "--rewrite-before-bg": "rgba(207, 114, 94, 0.16)",
          "--rewrite-after-bg": "rgba(126, 176, 141, 0.17)",
          "--rewrite-before-border": "1px solid rgba(207, 114, 94, 0.3)",
          "--rewrite-after-border": "1px solid rgba(126, 176, 141, 0.3)",
          "--rewrite-label-bg": "rgba(255, 255, 255, 0.04)",
          "--rewrite-label-padding": "0.16rem 0.4rem",
        },
      },
      {
        label: "Ghost Diff",
        note: "Border-led diff treatment with no fill and more card skeleton.",
        meta: "ghost rewrites",
        tokens: {
          "--rewrite-radius": "var(--radius-sm)",
          "--rewrite-padding": "0.84rem",
          "--rewrite-before-bg": "transparent",
          "--rewrite-after-bg": "transparent",
          "--rewrite-before-border": "1px solid rgba(207, 114, 94, 0.34)",
          "--rewrite-after-border": "1px solid rgba(126, 176, 141, 0.34)",
          "--rewrite-label-border": "1px solid rgba(255, 255, 255, 0.08)",
          "--rewrite-label-radius": "999px",
          "--rewrite-label-padding": "0.14rem 0.36rem",
        },
      },
      {
        label: "Neutral Diff",
        note: "Monochrome card bodies where color lives mainly in the borders.",
        meta: "neutral rewrites",
        tokens: {
          "--rewrite-radius": "var(--radius-sm)",
          "--rewrite-padding": "0.85rem",
          "--rewrite-before-bg": "rgba(255, 255, 255, 0.03)",
          "--rewrite-after-bg": "rgba(255, 255, 255, 0.03)",
          "--rewrite-before-border": "1px solid rgba(207, 114, 94, 0.24)",
          "--rewrite-after-border": "1px solid rgba(126, 176, 141, 0.24)",
          "--rewrite-label-color": "var(--ink-2)",
          "--rewrite-before-text": "var(--ink-2)",
          "--rewrite-after-text": "var(--ink-1)",
        },
      },
      {
        label: "Warm Label",
        note: "Label tape does more of the work than the card background.",
        meta: "warm label rewrites",
        tokens: {
          "--rewrite-radius": "var(--radius-sm)",
          "--rewrite-padding": "0.85rem",
          "--rewrite-before-bg": "rgba(207, 114, 94, 0.08)",
          "--rewrite-after-bg": "rgba(126, 176, 141, 0.09)",
          "--rewrite-before-border": "1px solid rgba(207, 114, 94, 0.18)",
          "--rewrite-after-border": "1px solid rgba(126, 176, 141, 0.18)",
          "--rewrite-label-color": "var(--accent)",
          "--rewrite-label-bg": "rgba(196, 158, 87, 0.12)",
          "--rewrite-label-border": "1px solid rgba(196, 158, 87, 0.24)",
          "--rewrite-label-radius": "var(--radius-pill)",
          "--rewrite-label-padding": "0.16rem 0.42rem",
        },
      },
      {
        label: "Heavy Diff",
        note: "Most emphatic diff with stronger stroke, lift, and slight card offset.",
        meta: "heavy rewrites",
        tokens: {
          "--rewrite-radius": "var(--radius-sm)",
          "--rewrite-gap": "0.9rem",
          "--rewrite-padding": "0.92rem",
          "--rewrite-card-shadow": "0 14px 26px rgba(0, 0, 0, 0.16)",
          "--rewrite-before-bg": "rgba(207, 114, 94, 0.14)",
          "--rewrite-after-bg": "rgba(126, 176, 141, 0.15)",
          "--rewrite-before-border": "2px solid rgba(207, 114, 94, 0.35)",
          "--rewrite-after-border": "2px solid rgba(126, 176, 141, 0.35)",
          "--rewrite-label-bg": "rgba(255, 255, 255, 0.05)",
          "--rewrite-label-padding": "0.18rem 0.42rem",
          "--rewrite-before-offset": "3px",
          "--rewrite-after-offset": "-3px",
        },
      },
      {
        label: "Pill Diff",
        note: "Highly rounded compare cards that feel softer and more productized.",
        meta: "pill rewrites",
        tokens: {
          "--rewrite-radius": "22px",
          "--rewrite-gap": "0.72rem",
          "--rewrite-padding": "0.9rem",
          "--rewrite-before-bg": "rgba(207, 114, 94, 0.08)",
          "--rewrite-after-bg": "rgba(126, 176, 141, 0.09)",
          "--rewrite-before-border": "1px solid rgba(207, 114, 94, 0.18)",
          "--rewrite-after-border": "1px solid rgba(126, 176, 141, 0.18)",
          "--rewrite-label-radius": "999px",
          "--rewrite-label-bg": "rgba(255, 255, 255, 0.04)",
          "--rewrite-label-padding": "0.18rem 0.46rem",
        },
      },
      {
        label: "Subtle Diff",
        note: "Very quiet compare cards that let the copy difference do the work.",
        meta: "subtle rewrites",
        tokens: {
          "--rewrite-radius": "var(--radius-sm)",
          "--rewrite-gap": "0.68rem",
          "--rewrite-padding": "0.8rem",
          "--rewrite-before-bg": "rgba(207, 114, 94, 0.04)",
          "--rewrite-after-bg": "rgba(126, 176, 141, 0.05)",
          "--rewrite-before-border": "1px solid rgba(207, 114, 94, 0.12)",
          "--rewrite-after-border": "1px solid rgba(126, 176, 141, 0.12)",
          "--rewrite-label-size": "0.6rem",
          "--rewrite-label-color": "var(--ink-3)",
        },
      },
      {
        label: "Accent Label",
        note: "Accent tape labels with darker card bodies behind them.",
        meta: "accent label rewrites",
        tokens: {
          "--rewrite-radius": "var(--radius-sm)",
          "--rewrite-padding": "0.85rem",
          "--rewrite-before-bg": "rgba(207, 114, 94, 0.08)",
          "--rewrite-after-bg": "rgba(126, 176, 141, 0.09)",
          "--rewrite-before-border": "1px solid rgba(207, 114, 94, 0.18)",
          "--rewrite-after-border": "1px solid rgba(126, 176, 141, 0.18)",
          "--rewrite-label-color": "var(--accent-contrast)",
          "--rewrite-label-bg": "var(--accent)",
          "--rewrite-label-border": "1px solid transparent",
          "--rewrite-label-radius": "var(--radius-xs)",
          "--rewrite-label-padding": "0.16rem 0.42rem",
        },
      },
      {
        label: "Notched Diff",
        note: "Technical, square-cornered diff with a slight layout stagger.",
        meta: "notched rewrites",
        tokens: {
          "--rewrite-radius": "2px",
          "--rewrite-gap": "0.8rem",
          "--rewrite-padding": "0.82rem",
          "--rewrite-before-bg": "rgba(207, 114, 94, 0.06)",
          "--rewrite-after-bg": "rgba(126, 176, 141, 0.07)",
          "--rewrite-before-border": "1px solid rgba(207, 114, 94, 0.24)",
          "--rewrite-after-border": "1px solid rgba(126, 176, 141, 0.24)",
          "--rewrite-label-border": "1px solid rgba(255, 255, 255, 0.08)",
          "--rewrite-label-radius": "0px",
          "--rewrite-label-padding": "0.14rem 0.32rem",
          "--rewrite-before-offset": "2px",
          "--rewrite-after-offset": "-2px",
        },
      },
    ],
  }),
  buildTokenGroup({
    id: "bank-fit",
    title: "17. Bank Fit Indicators",
    description: "Controls the row layout, borders, and typography of the bank fit list on the results sidebar.",
    renderPreview: renderBankFitPreview,
    options: [
      {
        label: "Default Fit",
        note: "Standard ledger rows with simple bottom dividers and balanced type.",
        meta: "default fit rows",
        tokens: {
          "--fit-row-gap": "0.7rem",
          "--fit-label-size": "0.88rem",
          "--fit-label-weight": "400",
          "--fit-row-padding-block": "0.6rem",
          "--fit-row-padding-inline": "0",
          "--fit-row-radius": "0px",
          "--fit-row-bg": "transparent",
          "--fit-row-shadow": "none",
          "--fit-row-divider-style": "solid",
          "--fit-row-divider-color": "rgba(255, 255, 255, 0.06)",
        },
      },
      {
        label: "Tight Rows",
        note: "Compressed ledger rows for denser, more terminal-like fit lists.",
        meta: "tight fit rows",
        tokens: {
          "--fit-row-gap": "0.42rem",
          "--fit-label-size": "0.82rem",
          "--fit-label-weight": "400",
          "--fit-row-padding-block": "0.36rem",
          "--fit-row-padding-inline": "0",
          "--fit-row-divider-color": "rgba(255, 255, 255, 0.06)",
        },
      },
      {
        label: "Wide Rows",
        note: "Spacious stacked rows that read more like fit cards than table lines.",
        meta: "wide fit rows",
        tokens: {
          "--fit-row-gap": "0.9rem",
          "--fit-label-size": "0.9rem",
          "--fit-label-weight": "500",
          "--fit-row-padding-block": "0.8rem",
          "--fit-row-padding-inline": "0.9rem",
          "--fit-row-radius": "12px",
          "--fit-row-bg": "rgba(255, 255, 255, 0.03)",
          "--fit-row-shadow": "0 10px 18px rgba(0, 0, 0, 0.12)",
          "--fit-row-divider-color": "transparent",
          "--fit-row-direction": "column",
          "--fit-row-align": "flex-start",
          "--fit-row-justify": "flex-start",
        },
      },
      {
        label: "Bold Names",
        note: "Name-forward rows with stronger weight and a clearer leading edge.",
        meta: "bold fit names",
        tokens: {
          "--fit-row-gap": "0.7rem",
          "--fit-label-size": "0.92rem",
          "--fit-label-weight": "650",
          "--fit-name-spacing": "0.01em",
          "--fit-row-divider-color": "rgba(255, 255, 255, 0.08)",
        },
      },
      {
        label: "No Dividers",
        note: "Chip-like rows that rely on shape and fill instead of ledger lines.",
        meta: "borderless fit rows",
        tokens: {
          "--fit-row-gap": "0.6rem",
          "--fit-label-size": "0.88rem",
          "--fit-label-weight": "500",
          "--fit-row-padding-block": "0.58rem",
          "--fit-row-padding-inline": "0.72rem",
          "--fit-row-radius": "10px",
          "--fit-row-bg": "rgba(255, 255, 255, 0.04)",
          "--fit-row-shadow": "0 6px 14px rgba(0, 0, 0, 0.1)",
          "--fit-row-divider-color": "transparent",
        },
      },
      {
        label: "Strong Dividers",
        note: "Higher-contrast separators for a stricter, more financial list view.",
        meta: "strong border fit",
        tokens: {
          "--fit-row-gap": "0.72rem",
          "--fit-label-size": "0.88rem",
          "--fit-label-weight": "450",
          "--fit-row-divider-color": "rgba(255, 255, 255, 0.16)",
        },
      },
      {
        label: "Large Names",
        note: "Bigger bank labels with a more editorial row rhythm.",
        meta: "large fit names",
        tokens: {
          "--fit-row-gap": "0.82rem",
          "--fit-label-size": "1rem",
          "--fit-label-weight": "600",
          "--fit-row-padding-block": "0.7rem",
          "--fit-row-padding-inline": "0",
        },
      },
      {
        label: "Small Names",
        note: "Compressed small-cap style rows that feel more data-dense.",
        meta: "small fit names",
        tokens: {
          "--fit-row-gap": "0.52rem",
          "--fit-label-size": "0.76rem",
          "--fit-label-weight": "500",
          "--fit-name-transform": "uppercase",
          "--fit-name-spacing": "0.14em",
          "--fit-row-padding-block": "0.44rem",
          "--fit-row-padding-inline": "0",
          "--fit-row-divider-color": "rgba(255, 255, 255, 0.05)",
        },
      },
      {
        label: "Accent Border",
        note: "Accent-led separators and warmer row surfaces for more signal.",
        meta: "accent fit borders",
        tokens: {
          "--fit-row-gap": "0.68rem",
          "--fit-label-size": "0.88rem",
          "--fit-label-weight": "500",
          "--fit-row-padding-block": "0.56rem",
          "--fit-row-padding-inline": "0.6rem",
          "--fit-row-radius": "8px",
          "--fit-row-bg": "rgba(196, 158, 87, 0.06)",
          "--fit-row-divider-color": "rgba(196, 158, 87, 0.28)",
          "--fit-name-color": "var(--accent)",
        },
      },
      {
        label: "Dashed Dividers",
        note: "Dashed separators for a more technical, dossier-like fit list.",
        meta: "dashed fit borders",
        tokens: {
          "--fit-row-gap": "0.7rem",
          "--fit-label-size": "0.88rem",
          "--fit-label-weight": "400",
          "--fit-row-divider-style": "dashed",
          "--fit-row-divider-color": "rgba(255, 255, 255, 0.1)",
        },
      },
      {
        label: "Heavy Bold",
        note: "Most emphatic row card with strong weight, fill, and depth.",
        meta: "heavy fit rows",
        tokens: {
          "--fit-row-gap": "0.84rem",
          "--fit-label-size": "0.94rem",
          "--fit-label-weight": "700",
          "--fit-row-padding-block": "0.72rem",
          "--fit-row-padding-inline": "0.8rem",
          "--fit-row-radius": "12px",
          "--fit-row-bg": "rgba(255, 255, 255, 0.05)",
          "--fit-row-shadow": "0 12px 20px rgba(0, 0, 0, 0.14)",
          "--fit-row-divider-color": "transparent",
        },
      },
      {
        label: "Thin Line",
        note: "Lightest treatment with hairline separators and restrained typography.",
        meta: "thin fit rows",
        tokens: {
          "--fit-row-gap": "0.56rem",
          "--fit-label-size": "0.84rem",
          "--fit-label-weight": "300",
          "--fit-row-padding-block": "0.48rem",
          "--fit-row-padding-inline": "0",
          "--fit-row-divider-color": "rgba(255, 255, 255, 0.04)",
        },
      },
    ],
  }),
  buildTokenGroup({
    id: "section-headers",
    title: "18. Section Headers",
    description: "Controls the size, weight, spacing, and casing of section headings and panel titles site-wide.",
    renderPreview: (option) => `
      <div class="swatch-preview" style="${styleString(option.tokens)}">
        <div style="font-family:var(--font-heading);font-size:${option.tokens["--section-size"]||"clamp(1.35rem, 2vw, 1.75rem)"};font-weight:${option.tokens["--section-weight"]||"400"};letter-spacing:${option.tokens["--section-spacing"]||"-0.02em"};text-transform:${option.tokens["--section-transform"]||"none"};color:${option.tokens["--section-color"]||"var(--ink-1)"}">
          Critical Fixes
        </div>
        <div class="design-card-meta">${escapeHtml(option.note)}</div>
      </div>
    `,
    options: [
      { label: "Default Header", note: "Standard section heading style", meta: "default headers", tokens: { "--section-size": "clamp(1.35rem, 2vw, 1.75rem)", "--section-weight": "400", "--section-spacing": "-0.02em", "--section-transform": "none", "--section-color": "var(--ink-1)" } },
      { label: "Bold Header", note: "Heavier weight section headings", meta: "bold headers", tokens: { "--section-size": "clamp(1.35rem, 2vw, 1.75rem)", "--section-weight": "700", "--section-spacing": "-0.02em", "--section-transform": "none", "--section-color": "var(--ink-1)" } },
      { label: "Uppercase Header", note: "All-caps section headings", meta: "uppercase headers", tokens: { "--section-size": "clamp(1rem, 1.5vw, 1.25rem)", "--section-weight": "600", "--section-spacing": "0.08em", "--section-transform": "uppercase", "--section-color": "var(--ink-1)" } },
      { label: "Large Header", note: "Bigger section headings", meta: "large headers", tokens: { "--section-size": "clamp(1.6rem, 2.4vw, 2.1rem)", "--section-weight": "400", "--section-spacing": "-0.03em", "--section-transform": "none", "--section-color": "var(--ink-1)" } },
      { label: "Small Header", note: "More compact section headings", meta: "small headers", tokens: { "--section-size": "clamp(1.1rem, 1.6vw, 1.35rem)", "--section-weight": "500", "--section-spacing": "-0.01em", "--section-transform": "none", "--section-color": "var(--ink-1)" } },
      { label: "Accent Header", note: "Section headings in accent color", meta: "accent headers", tokens: { "--section-size": "clamp(1.35rem, 2vw, 1.75rem)", "--section-weight": "400", "--section-spacing": "-0.02em", "--section-transform": "none", "--section-color": "var(--accent)" } },
      { label: "Muted Header", note: "Softer heading color", meta: "muted headers", tokens: { "--section-size": "clamp(1.35rem, 2vw, 1.75rem)", "--section-weight": "400", "--section-spacing": "-0.02em", "--section-transform": "none", "--section-color": "var(--ink-2)" } },
      { label: "Tight Spaced", note: "Tighter letter-spacing", meta: "tight headers", tokens: { "--section-size": "clamp(1.35rem, 2vw, 1.75rem)", "--section-weight": "500", "--section-spacing": "-0.04em", "--section-transform": "none", "--section-color": "var(--ink-1)" } },
      { label: "Wide Spaced", note: "Wider letter-spacing for editorial feel", meta: "wide headers", tokens: { "--section-size": "clamp(1.2rem, 1.8vw, 1.5rem)", "--section-weight": "600", "--section-spacing": "0.04em", "--section-transform": "none", "--section-color": "var(--ink-1)" } },
      { label: "Heavy Title", note: "Maximum weight for impact", meta: "heavy headers", tokens: { "--section-size": "clamp(1.4rem, 2.2vw, 1.85rem)", "--section-weight": "800", "--section-spacing": "-0.03em", "--section-transform": "none", "--section-color": "var(--ink-1)" } },
      { label: "Capitalize", note: "Title case transformation", meta: "capitalize headers", tokens: { "--section-size": "clamp(1.35rem, 2vw, 1.75rem)", "--section-weight": "500", "--section-spacing": "0.01em", "--section-transform": "capitalize", "--section-color": "var(--ink-1)" } },
      { label: "Thin Title", note: "Light weight, larger size", meta: "thin headers", tokens: { "--section-size": "clamp(1.5rem, 2.2vw, 1.9rem)", "--section-weight": "300", "--section-spacing": "-0.01em", "--section-transform": "none", "--section-color": "var(--ink-1)" } },
    ],
  }),
];

const DESIGN_GROUPS = [...fontGroups, ...tokenGroups, ...newGroups].sort((left, right) => {
  const leftOrder = Number.parseInt(left.title, 10);
  const rightOrder = Number.parseInt(right.title, 10);
  return leftOrder - rightOrder;
});

const optionLookup = new Map(
  DESIGN_GROUPS.flatMap((group) => group.options.map((option) => [`${group.id}:${option.id}`, option]))
);

const selectionState = Object.fromEntries(
  DESIGN_GROUPS.map((group) => [group.id, group.options[0].id])
);

const DEFAULT_HOME_PAGE = "page-lab";

const uiState = {
  banks: new Set(["Goldman Sachs", "Morgan Stanley", "J.P. Morgan"]),
  resume: {
    name: "No file selected",
    previewMode: "Awaiting PDF",
    status: "Ready for upload",
    previewImage: "",
    loaded: false,
  },
};

const allTokenNames = [
  ...new Set(DESIGN_GROUPS.flatMap((group) => group.options.flatMap((option) => Object.keys(option.tokens)))),
];

const groupById = (groupId) => DESIGN_GROUPS.find((group) => group.id === groupId);
const selectedOption = (groupId) => optionLookup.get(`${groupId}:${selectionState[groupId]}`);

const BANK_RESEARCH = {
  "Goldman Sachs": {
    analysis:
      "Bullets need sharper deal context and quantified ownership. The resume reads smart, but still too indirect for a first-pass Goldman screen.",
    intel:
      "Network intensively and tighten the resume to emphasize execution, numbers, and evidence of judgment under pressure.",
    signals: ["Transaction context", "Quantified impact", "Decision-quality judgment"],
  },
  "Morgan Stanley": {
    analysis:
      "The profile is credible, but it needs cleaner positioning and better bullet hierarchy so the strongest lines land faster.",
    intel:
      "Push leadership and client-facing signals harder, and make the finance exposure read more deliberate.",
    signals: ["Client exposure", "Leadership range", "Clean narrative positioning"],
  },
  "J.P. Morgan": {
    analysis:
      "Work quality is visible, but the resume would benefit from clearer business outcomes and stronger commercial framing.",
    intel:
      "J.P. Morgan tends to reward polish, scale, and a resume that balances technical rigor with broad business awareness.",
    signals: ["Commercial awareness", "Team execution", "Reliable quantitative output"],
  },
  Evercore: {
    analysis:
      "The resume needs more transaction-specific detail. The current bullets still feel high-level for a bank that screens hard on precision.",
    intel:
      "Refine deal language and show more explicit proof of modeling depth and analytical range.",
    signals: ["Deal specificity", "Modeling depth", "Independent analytical rigor"],
  },
  Lazard: {
    analysis:
      "Good raw signal, but the narrative needs to feel more polished and more clearly tied to advisory-style work.",
    intel:
      "Lean into strategic finance, communication strength, and concise evidence of high-trust workstreams.",
    signals: ["Advisory polish", "Strategic framing", "High-trust execution"],
  },
  Moelis: {
    analysis:
      "The resume has intensity, but it still needs tighter results language and more measurable ownership to feel competitive.",
    intel:
      "Show pace, pressure, and hard output. Moelis-style screens reward direct execution and less softened wording.",
    signals: ["High-pressure execution", "Clear ownership", "Measured output"],
  },
  "PJT Partners": {
    analysis:
      "Technical signal is visible, but the bullets need to read more elite and less generic in the first 20 seconds.",
    intel:
      "Prioritize sophistication: stronger verbs, cleaner structure, and tighter evidence of complex analytical work.",
    signals: ["Sophisticated technical work", "Elite-level polish", "Concise evidence"],
  },
  Centerview: {
    analysis:
      "The resume feels intelligent, but the case would be stronger with sharper selectivity and more obviously differentiated wins.",
    intel:
      "Centerview-style positioning works better when every line feels curated, high-signal, and outcome-heavy.",
    signals: ["Selective curation", "Outcome density", "High-signal positioning"],
  },
  Jefferies: {
    analysis:
      "The profile has enough energy for Jefferies, but it needs harder quantified bullets to move from plausible to compelling.",
    intel:
      "Emphasize work ethic, capacity, and concrete execution under volume and pressure.",
    signals: ["Workload capacity", "Quantified execution", "High-energy profile"],
  },
};

const FIT_STATUSES = [
  { label: "Moderate", className: "status-pill--warning", summary: "Workable · Needs fixes" },
  { label: "Weak", className: "status-pill--danger", summary: "At risk · Needs rewrite" },
  { label: "Strong", className: "status-pill--success", summary: "Strong enough to send" },
  { label: "Moderate", className: "status-pill--warning", summary: "Workable · Needs fixes" },
  { label: "Watch", className: "status-pill--warning", summary: "Needs tighter positioning" },
];

function getBankResearch(bank) {
  return (
    BANK_RESEARCH[bank] || {
      analysis:
        "The profile is plausible, but it needs stronger quantified outcomes and clearer positioning before it feels bank-ready.",
      intel:
        "Clarify your role, sharpen impact, and make the first three bullets feel more selective and obviously finance-native.",
      signals: ["Quantified impact", "Clear ownership", "Tighter positioning"],
    }
  );
}

function renderDesignSections() {
  const container = document.getElementById("design-sections");
  container.innerHTML = DESIGN_GROUPS.map((group) => renderGroup(group)).join("");
}

function renderGroup(group) {
  return `
    <section class="design-section panel" data-group-id="${group.id}">
      <div class="design-section-header">
        <h2 class="design-section-title">${escapeHtml(group.title)}</h2>
        <p class="design-section-meta">${escapeHtml(group.description)}</p>
      </div>
      <div class="design-grid">
        ${group.options.map((option) => renderCard(group, option)).join("")}
      </div>
    </section>
  `;
}

function renderCard(group, option) {
  const isSelected = selectionState[group.id] === option.id;
  return `
    <button
      class="design-card${isSelected ? " is-selected" : ""}"
      data-group="${group.id}"
      data-option="${option.id}"
      data-testid="option-${group.id}-${option.id}"
      type="button"
    >
      <div class="design-card-top">
        <span class="design-card-label">${escapeHtml(option.label)}</span>
        <span class="card-chip">${isSelected ? "Current" : "Alt"}</span>
      </div>
      <div class="design-card-preview">
        ${group.renderPreview(option)}
      </div>
      <div class="design-card-meta">${escapeHtml(option.note)}</div>
    </button>
  `;
}

const STORAGE_KEY = "ib-resume-bench-app-state";
const LEGACY_SELECTION_STORAGE_KEY = "ib-resume-bench-selections";

function getCandidateFormState() {
  return {
    name: document.getElementById("candidate-name").value.trim(),
    school: document.getElementById("candidate-school").value.trim(),
    year: document.getElementById("candidate-year").value.trim(),
    major: document.getElementById("candidate-major").value.trim(),
    gpa: document.getElementById("candidate-gpa").value.trim(),
    cycle: document.getElementById("candidate-cycle").value.trim(),
  };
}

function buildManifestSnapshot() {
  return {
    generatedAt: new Date().toISOString(),
    theme: DESIGN_GROUPS.map((group) => ({
      id: group.id,
      title: group.title,
      selectionId: selectedOption(group.id).id,
      selection: selectedOption(group.id).label,
      tokens: selectedOption(group.id).tokens,
    })),
    uiState: {
      banks: [...uiState.banks],
      resume: { ...uiState.resume },
      candidate: getCandidateFormState(),
    },
  };
}

function saveAppState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buildManifestSnapshot()));
    localStorage.setItem(LEGACY_SELECTION_STORAGE_KEY, JSON.stringify(selectionState));
  } catch (_) {}
}

function hydrateSelections(themeEntries = []) {
  let appliedCount = 0;

  themeEntries.forEach((entry) => {
    if (!entry || typeof entry !== "object" || typeof entry.id !== "string") {
      return;
    }

    const group = groupById(entry.id);
    if (!group) {
      return;
    }

    let nextOption = null;

    if (typeof entry.selectionId === "string") {
      nextOption = group.options.find((option) => option.id === entry.selectionId) || null;
    }

    if (!nextOption && typeof entry.selection === "string") {
      nextOption = group.options.find((option) => option.label === entry.selection) || null;
    }

    if (!nextOption && typeof entry.optionId === "string") {
      nextOption = group.options.find((option) => option.id === entry.optionId) || null;
    }

    if (!nextOption) {
      return;
    }

    selectionState[group.id] = nextOption.id;
    appliedCount += 1;
  });

  return appliedCount;
}

function hydrateLegacySelections() {
  try {
    const saved = localStorage.getItem(LEGACY_SELECTION_STORAGE_KEY);
    if (!saved) return;
    const parsed = JSON.parse(saved);
    for (const [groupId, optionId] of Object.entries(parsed)) {
      if (selectionState.hasOwnProperty(groupId) && optionLookup.has(`${groupId}:${optionId}`)) {
        selectionState[groupId] = optionId;
      }
    }
  } catch (_) {}
}

function loadAppState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      hydrateLegacySelections();
      return;
    }

    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object") {
      hydrateLegacySelections();
      return;
    }

    if (Array.isArray(parsed.theme)) {
      hydrateSelections(parsed.theme);
    } else {
      hydrateLegacySelections();
    }

    if (parsed.uiState && typeof parsed.uiState === "object") {
      applyManifestUiState(parsed.uiState, { persist: false });
    }
  } catch (_) {
    hydrateLegacySelections();
  }
}

function applySelections() {
  const root = document.documentElement;
  allTokenNames.forEach((tokenName) => {
    root.style.removeProperty(tokenName);
  });

  DESIGN_GROUPS.forEach((group) => {
    const option = selectedOption(group.id);
    Object.entries(option.tokens).forEach(([tokenName, value]) => {
      root.style.setProperty(tokenName, value);
    });
  });

  saveAppState();
}

function updateSelectionLedger() {
  const ledger = document.getElementById("selection-ledger");
  ledger.innerHTML = DESIGN_GROUPS.map((group) => {
    const option = selectedOption(group.id);
    return `
      <div class="selection-row">
        <span class="selection-key">${escapeHtml(group.title.replace(/^\d+\.\s*/, ""))}</span>
        <span class="selection-value">${escapeHtml(option.label)}</span>
      </div>
    `;
  }).join("");

  document.getElementById("selection-count").textContent = `${DESIGN_GROUPS.length} active decisions`;
}

function updateSelectionClasses(groupId) {
  document.querySelectorAll(`[data-group="${groupId}"]`).forEach((card) => {
    const isSelected = card.dataset.option === selectionState[groupId];
    card.classList.toggle("is-selected", isSelected);
    const chip = card.querySelector(".card-chip");
    if (chip) {
      chip.textContent = isSelected ? "Current" : "Alt";
    }
  });
}

function activatePage(pageId) {
  document.querySelectorAll(".app-page").forEach((page) => {
    page.classList.toggle("is-active", page.id === pageId);
  });

  document.querySelectorAll(".page-tab").forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.pageTarget === pageId);
  });
}

function renderResumeState() {
  const { resume } = uiState;
  document.getElementById("upload-file-name").textContent = resume.name;
  document.getElementById("upload-preview-mode").textContent = resume.previewMode;
  document.getElementById("upload-status").textContent = resume.status;
  const resultsFile = document.getElementById("results-file-name");
  if (resultsFile) {
    resultsFile.textContent = resume.name;
  }

  const preview = document.getElementById("resume-preview");
  const placeholder = document.getElementById("resume-placeholder");
  const previewImage = document.getElementById("resume-preview-image");
  const thumb = document.getElementById("results-resume-thumb");

  if (resume.previewImage) {
    preview.classList.remove("is-empty");
    previewImage.hidden = false;
    previewImage.src = resume.previewImage;
    previewImage.alt = `${resume.name} preview`;
    placeholder.hidden = true;
    thumb.innerHTML = `<img alt="${escapeHtml(resume.name)} preview" src="${escapeHtml(resume.previewImage)}">`;
  } else if (resume.loaded) {
    preview.classList.remove("is-empty");
    previewImage.hidden = true;
    previewImage.removeAttribute("src");
    placeholder.hidden = false;
    placeholder.innerHTML = `
      <p class="resume-placeholder-title">${escapeHtml(resume.name)}</p>
      <p class="page-copy">${escapeHtml(resume.status)}. Rendering a generic document card because this static build does not bundle PDF.js.</p>
    `;
    thumb.innerHTML = `<p class="page-copy">${escapeHtml(resume.name)} loaded. Preview is metadata-only in the results sidebar.</p>`;
  } else {
    preview.classList.add("is-empty");
    previewImage.hidden = true;
    previewImage.removeAttribute("src");
    placeholder.hidden = false;
    placeholder.innerHTML = `
      <p class="resume-placeholder-title">No file loaded</p>
      <p class="page-copy">Load the bundled PDF or upload your own to populate the flow.</p>
    `;
    thumb.innerHTML = `<p class="page-copy">Load the sample resume to populate the visual state.</p>`;
  }

  saveAppState();
}

function renderCandidateState() {
  const candidateState = getCandidateFormState();
  const name = candidateState.name || "Alex Morgan";
  const school = candidateState.school || "Wharton";
  const cycle = candidateState.cycle || "2027 Summer Analyst";
  const activeFields = [
    candidateState.name,
    candidateState.school,
    candidateState.year,
    candidateState.major,
    candidateState.gpa,
    candidateState.cycle,
  ].filter(Boolean).length;

  const resultsName = document.getElementById("results-name");
  const resultsSchool = document.getElementById("results-school");
  const resultsCycle = document.getElementById("results-cycle");
  if (resultsName) resultsName.textContent = name;
  if (resultsSchool) resultsSchool.textContent = school;
  if (resultsCycle) resultsCycle.textContent = cycle;
  document.querySelector('[data-testid="about-mono"]').textContent = String(activeFields).padStart(2, "0");
  saveAppState();
}

function renderBankState() {
  const banks = [...uiState.banks];
  const container = document.getElementById("fit-list");
  const intelContainer = document.getElementById("intel-list");
  const summaryBank = document.getElementById("results-summary-bank");
  const summaryStatus = document.getElementById("results-summary-status");
  const summaryCopy = document.getElementById("results-summary-copy");
  const visibleBanks = banks.slice(0, 3);

  container.innerHTML = visibleBanks
    .map((bank, index) => {
      const status = FIT_STATUSES[index] || FIT_STATUSES[0];
      const research = getBankResearch(bank);
      return `
        <div class="fit-row fit-row--analysis">
          <div class="fit-row-top">
            <span class="fit-name">${escapeHtml(bank)}</span>
            <span class="status-pill ${status.className}">${escapeHtml(status.label)}</span>
          </div>
          <p class="fit-row-copy">${escapeHtml(research.analysis)}</p>
        </div>
      `;
    })
    .join("");

  intelContainer.innerHTML = visibleBanks
    .map((bank) => {
      const research = getBankResearch(bank);
      return `
        <section class="intel-block">
          <h3 class="intel-bank">${escapeHtml(bank)}</h3>
          <p class="intel-copy">${escapeHtml(research.intel)}</p>
          <ul>
            ${research.signals.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </section>
      `;
    })
    .join("");

  if (visibleBanks.length) {
    const primaryBank = visibleBanks[0];
    const primaryStatus = FIT_STATUSES[0];
    const primaryResearch = getBankResearch(primaryBank);
    if (summaryBank) summaryBank.textContent = primaryBank;
    if (summaryStatus) {
      summaryStatus.className = `status-pill ${primaryStatus.className}`;
      summaryStatus.textContent = primaryStatus.summary;
    }
    if (summaryCopy) {
      summaryCopy.textContent = primaryResearch.analysis;
    }
  }

  document.querySelector('[data-testid="banks-mono"]').textContent = String(banks.length).padStart(2, "0");
  saveAppState();
}

function renderBankSelectionStates() {
  document.querySelectorAll(".bank-card").forEach((card) => {
    card.classList.toggle("is-selected", uiState.banks.has(card.dataset.bank));
  });
}

function setSampleResume() {
  uiState.resume = {
    name: "resume-sample.pdf",
    previewMode: "Sample PNG proxy for bundled PDF",
    status: "Sample asset loaded",
    previewImage: "assets/resume-sample-preview.png",
    loaded: true,
  };
  renderResumeState();
}

function handleResumeFile(file) {
  if (!file || file.type !== "application/pdf") {
    uiState.resume = {
      name: "Unsupported file",
      previewMode: "PDF required",
      status: "Please upload a PDF",
      previewImage: "",
      loaded: false,
    };
    renderResumeState();
    return;
  }

  uiState.resume = {
    name: file.name,
    previewMode:
      file.name === "resume-sample.pdf"
        ? "Sample PNG proxy for bundled PDF"
        : "Document card preview",
    status: `${Math.max(1, Math.round(file.size / 1024))} KB PDF loaded`,
    previewImage: file.name === "resume-sample.pdf" ? "assets/resume-sample-preview.png" : "",
    loaded: true,
  };

  renderResumeState();
}

function exportManifest() {
  const manifest = buildManifestSnapshot();

  const blob = new Blob([JSON.stringify(manifest, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "ib-resume-bench-manifest.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

function setManifestStatus(message, isError = false) {
  const status = document.getElementById("manifest-status");
  if (!status) return;
  status.textContent = message;
  status.style.color = isError ? "var(--danger)" : "var(--ink-3)";
}

function applyManifestSelections(themeEntries = []) {
  const appliedCount = hydrateSelections(themeEntries);

  renderDesignSections();
  applySelections();
  updateSelectionLedger();

  return appliedCount;
}

function applyManifestCandidate(candidate = {}) {
  const fieldMap = {
    name: "candidate-name",
    school: "candidate-school",
    year: "candidate-year",
    major: "candidate-major",
    gpa: "candidate-gpa",
    cycle: "candidate-cycle",
  };

  Object.entries(fieldMap).forEach(([key, fieldId]) => {
    if (typeof candidate[key] === "string") {
      document.getElementById(fieldId).value = candidate[key];
    }
  });

  renderCandidateState();
}

function applyManifestResume(resume = {}) {
  if (!resume || typeof resume !== "object") {
    return;
  }

  const previewImage =
    typeof resume.previewImage === "string" && resume.previewImage.startsWith("assets/")
      ? resume.previewImage
      : "";

  uiState.resume = {
    name: typeof resume.name === "string" && resume.name ? resume.name : "No file selected",
    previewMode:
      typeof resume.previewMode === "string" && resume.previewMode ? resume.previewMode : "Awaiting PDF",
    status: typeof resume.status === "string" && resume.status ? resume.status : "Ready for upload",
    previewImage,
    loaded: Boolean(resume.loaded),
  };

  renderResumeState();
}

function applyManifestUiState(manifestUiState = {}, { persist = true } = {}) {
  if (Array.isArray(manifestUiState.banks)) {
    uiState.banks = new Set(manifestUiState.banks.filter((bank) => typeof bank === "string" && bank.trim()));
  }

  renderBankSelectionStates();
  renderBankState();

  if (manifestUiState.candidate && typeof manifestUiState.candidate === "object") {
    applyManifestCandidate(manifestUiState.candidate);
  }

  if (manifestUiState.resume && typeof manifestUiState.resume === "object") {
    applyManifestResume(manifestUiState.resume);
  }

  if (persist) {
    saveAppState();
  }
}

function importManifestObject(manifest) {
  if (!manifest || typeof manifest !== "object") {
    throw new Error("Manifest JSON must be an object.");
  }

  if (!Array.isArray(manifest.theme)) {
    throw new Error("Manifest is missing a valid theme array.");
  }

  const appliedCount = applyManifestSelections(manifest.theme);
  applyManifestUiState(manifest.uiState || {});

  if (!appliedCount) {
    throw new Error("No matching design groups were found in the imported manifest.");
  }

  setManifestStatus(`Imported manifest. Restored ${appliedCount} design decisions.`);
}

function bindEvents() {
  document.addEventListener("click", (event) => {
    const designCard = event.target.closest(".design-card");
    if (designCard) {
      const { group, option } = designCard.dataset;
      selectionState[group] = option;
      applySelections();
      updateSelectionClasses(group);
      updateSelectionLedger();
      return;
    }

    const pageTab = event.target.closest(".page-tab");
    if (pageTab) {
      activatePage(pageTab.dataset.pageTarget);
      return;
    }

    const goTab = event.target.closest("[data-go-tab]");
    if (goTab) {
      activatePage(goTab.dataset.goTab);
      return;
    }

    if (event.target.id === "toolbar-use-sample" || event.target.id === "use-sample-resume") {
      setSampleResume();
      activatePage("page-upload");
      return;
    }

    if (event.target.id === "open-file-picker") {
      document.getElementById("resume-input").click();
      return;
    }

    if (event.target.id === "import-theme") {
      document.getElementById("manifest-input").click();
      return;
    }

    if (event.target.id === "reset-theme") {
      DESIGN_GROUPS.forEach((group) => {
        selectionState[group.id] = group.options[0].id;
      });
      renderDesignSections();
      applySelections();
      updateSelectionLedger();
      saveAppState();
      return;
    }

    if (event.target.id === "export-theme") {
      exportManifest();
      return;
    }

    if (event.target.id === "direction-toggle" || event.target.closest("#direction-toggle")) {
      const toggle = document.getElementById("direction-toggle");
      const ledger = document.getElementById("selection-ledger");
      toggle.classList.toggle("is-collapsed");
      ledger.classList.toggle("is-collapsed");
      return;
    }

    const bankCard = event.target.closest(".bank-card");
    if (bankCard) {
      const bank = bankCard.dataset.bank;
      if (uiState.banks.has(bank)) {
        uiState.banks.delete(bank);
      } else {
        uiState.banks.add(bank);
      }
      renderBankSelectionStates();
      renderBankState();
    }
  });

  document
    .querySelectorAll(
      "#candidate-name, #candidate-school, #candidate-year, #candidate-major, #candidate-gpa, #candidate-cycle"
    )
    .forEach((input) => {
    input.addEventListener("input", renderCandidateState);
  });

  const resumeInput = document.getElementById("resume-input");
  resumeInput.addEventListener("change", (event) => {
    const [file] = event.target.files;
    handleResumeFile(file);
  });

  const manifestInput = document.getElementById("manifest-input");
  manifestInput.addEventListener("change", async (event) => {
    const [file] = event.target.files;

    if (!file) {
      return;
    }

    try {
      const parsed = JSON.parse(await file.text());
      importManifestObject(parsed);
    } catch (error) {
      setManifestStatus(
        error instanceof Error ? `Manifest import failed: ${error.message}` : "Manifest import failed.",
        true
      );
    } finally {
      manifestInput.value = "";
    }
  });

  const dropZone = document.getElementById("drop-zone");
  ["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.add("is-dragging");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.remove("is-dragging");
    });
  });

  dropZone.addEventListener("drop", (event) => {
    const [file] = [...event.dataTransfer.files];
    handleResumeFile(file);
  });
}

function boot() {
  loadAppState();
  renderDesignSections();
  applySelections();
  updateSelectionLedger();
  renderResumeState();
  renderCandidateState();
  renderBankState();
  renderBankSelectionStates();
  activatePage(DEFAULT_HOME_PAGE);
  bindEvents();

  window.__designLab = {
    groups: DESIGN_GROUPS.map((group) => ({
      id: group.id,
      title: group.title,
      options: group.options.map((option) => ({
        id: option.id,
        label: option.label,
        tokens: option.tokens,
      })),
    })),
    getSelections: () => ({ ...selectionState }),
    importManifestObject,
    setSampleResume,
    activatePage,
  };
}

boot();
