"use client";

import { useMemo, useRef, useState } from "react";

interface Line {
  index: number;
  original: string;
  translation: string;
  blank: boolean;
  failed: boolean;
}

type StreamEvent =
  | { type: "line"; index: number; original: string; translation: string }
  | { type: "error"; index: number; original: string; message: string }
  | { type: "done"; count: number };

const SAMPLE = `Bajo la luna llena
canto tu nombre otra vez
el río lleva mis palabras
hacia el mar que no te ve`;

export default function Home() {
  const [input, setInput] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const canTranslate = input.trim().length > 0 && !busy;

  const fullText = useMemo(
    () =>
      lines
        .map((l) => (l.blank ? "" : l.translation))
        .join("\n")
        .replace(/\n{3,}/g, "\n\n"),
    [lines],
  );

  async function translate() {
    if (!canTranslate) return;
    setBusy(true);
    setError(null);
    setLines([]);
    setCopied(false);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status}).`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          const chunk = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (chunk) handleEvent(JSON.parse(chunk) as StreamEvent);
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError((err as Error).message);
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  function handleEvent(event: StreamEvent) {
    if (event.type === "done") return;
    setLines((prev) => [
      ...prev,
      event.type === "line"
        ? {
            index: event.index,
            original: event.original,
            translation: event.translation,
            blank: event.original === "" && event.translation === "",
            failed: false,
          }
        : {
            index: event.index,
            original: event.original,
            translation: `⚠ untranslated — ${event.message}`,
            blank: false,
            failed: true,
          },
    ]);
  }

  function stop() {
    abortRef.current?.abort();
  }

  async function copyAll() {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main className="wrap">
      <header>
        <p className="eyebrow">Powered by Claude</p>
        <h1>
          Translate anything,
          <br />
          <em>line by line.</em>
        </h1>
        <p>
          Paste a chunk of text — lyrics, a poem, a paragraph. It translates into
          English one line at a time and streams each line in as it finishes.
        </p>
      </header>

      <section className="panel">
        <label className="field-label" htmlFor="src">
          Source text
        </label>
        <textarea
          id="src"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={SAMPLE}
          spellCheck={false}
        />
        <div className="controls">
          {busy ? (
            <button className="translate" onClick={stop}>
              Stop
            </button>
          ) : (
            <button className="translate" onClick={translate} disabled={!canTranslate}>
              Translate to English
            </button>
          )}
          {input.trim() === "" && !busy && (
            <button
              className="copy-btn"
              style={{ marginTop: 0 }}
              onClick={() => setInput(SAMPLE)}
            >
              Try a sample
            </button>
          )}
          {busy && (
            <span className="status">
              <span className="dot" />
              translating line {lines.length + 1}…
            </span>
          )}
        </div>

        {error && <div className="error-banner">{error}</div>}
      </section>

      {lines.length > 0 && (
        <section className="results">
          <h2>Translation</h2>
          {lines.map((l) =>
            l.blank ? (
              <div key={l.index} className="row blank" />
            ) : (
              <div key={l.index} className={`row${l.failed ? " failed" : ""}`}>
                <div className="orig">{l.original}</div>
                <div className="trans">{l.translation}</div>
              </div>
            ),
          )}

          {!busy && fullText.trim() !== "" && (
            <details className="plaintext">
              <summary>Full English text (plain)</summary>
              <pre>{fullText}</pre>
              <button className="copy-btn" onClick={copyAll}>
                {copied ? "Copied ✓" : "Copy translation"}
              </button>
            </details>
          )}
        </section>
      )}
    </main>
  );
}
