import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildBatchPrompt,
  buildLocalPrompt,
  chunk,
  extractTranslation,
  parseBatch,
  splitLines,
  streamTranslations,
  translateBatch,
  translateLineLocal,
  type ResultSink,
  type SourceLine,
} from "./translate";

describe("splitLines", () => {
  it("returns [] for empty input", () => {
    expect(splitLines("")).toEqual([]);
  });

  it("classifies content and blank lines and preserves order", () => {
    expect(splitLines("hola\n\nmundo")).toEqual([
      { index: 0, text: "hola", kind: "content" },
      { index: 1, text: "", kind: "blank" },
      { index: 2, text: "mundo", kind: "content" },
    ]);
  });

  it("treats whitespace-only lines as blank", () => {
    expect(splitLines("a\n   \nb")[1].kind).toBe("blank");
  });

  it("drops exactly one trailing newline (no spurious empty line)", () => {
    expect(splitLines("solo\n")).toEqual([{ index: 0, text: "solo", kind: "content" }]);
  });

  it("keeps a second trailing newline as a real blank line", () => {
    const result = splitLines("solo\n\n");
    expect(result).toHaveLength(2);
    expect(result[1].kind).toBe("blank");
  });

  it("normalizes CRLF and lone CR to LF", () => {
    expect(splitLines("a\r\nb\rc").map((l) => l.text)).toEqual(["a", "b", "c"]);
  });
});

describe("chunk", () => {
  it("splits into fixed-size groups", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("returns [] for empty input", () => {
    expect(chunk([], 3)).toEqual([]);
  });
});

describe("buildBatchPrompt", () => {
  it("numbers each line by its global index", () => {
    const lines: SourceLine[] = [
      { index: 0, text: "hola", kind: "content" },
      { index: 3, text: "mundo", kind: "content" },
    ];
    const p = buildBatchPrompt(lines);
    expect(p).toContain("0: hola");
    expect(p).toContain("3: mundo");
    expect(p).toContain("<t N>");
  });
});

describe("parseBatch", () => {
  it("maps <t N> tags back to their indices", () => {
    const map = parseBatch("<t 0>hi</t>\n<t 3>world</t>");
    expect(map.get(0)).toBe("hi");
    expect(map.get(3)).toBe("world");
  });

  it("ignores surrounding chatter and trims", () => {
    const map = parseBatch("Here you go:\n<t 1>  the river  </t>\ndone");
    expect(map.get(1)).toBe("the river");
    expect(map.size).toBe(1);
  });
});

describe("translateBatch", () => {
  it("sends numbered lines and returns the parsed map", async () => {
    const run = vi.fn().mockResolvedValue("<t 0>under the full moon</t>\n<t 1>the river</t>");
    const map = await translateBatch(
      [
        { index: 0, text: "bajo la luna", kind: "content" },
        { index: 1, text: "el río", kind: "content" },
      ],
      { run },
    );
    expect(map.get(0)).toBe("under the full moon");
    expect(map.get(1)).toBe("the river");
    expect(run.mock.calls[0][0]).toContain("bajo la luna");
  });

  it("returns an empty map without calling the runner for no lines", async () => {
    const run = vi.fn();
    expect((await translateBatch([], { run })).size).toBe(0);
    expect(run).not.toHaveBeenCalled();
  });
});

describe("extractTranslation", () => {
  it("pulls the <t> contents out of chatty output", () => {
    expect(extractTranslation("sure:\n<t>the river</t>\nok")).toBe("the river");
  });

  it("strips a <think> block before extracting", () => {
    expect(extractTranslation("<think>hmm, spanish</think><t>hello</t>")).toBe("hello");
  });

  it("falls back to trimmed raw when no tags are present", () => {
    expect(extractTranslation("  hello  ")).toBe("hello");
  });
});

describe("buildLocalPrompt", () => {
  it("includes the line and asks for <t></t> only", () => {
    const p = buildLocalPrompt("hola mundo");
    expect(p).toContain("hola mundo");
    expect(p).toContain("<t></t>");
  });
});

describe("translateLineLocal", () => {
  it("sends the line and extracts the tagged translation", async () => {
    const run = vi.fn().mockResolvedValue("<t>hello world</t>");
    expect(await translateLineLocal("hola mundo", { run })).toBe("hello world");
    expect(run.mock.calls[0][0]).toContain("hola mundo");
  });
});

describe("streamTranslations", () => {
  const content: SourceLine[] = [
    { index: 0, text: "hola", kind: "content" },
    { index: 2, text: "mundo", kind: "content" },
  ];

  afterEach(() => {
    delete process.env.TRANSLATE_BACKEND;
  });

  function collect(): { results: Record<number, string | null>; sink: ResultSink } {
    const results: Record<number, string | null> = {};
    return { results, sink: (i, t) => { results[i] = t; } };
  }

  // Local-backend stubs: the runner is an async stream of response chunks.
  async function* streamOf(s: string): AsyncGenerator<string> {
    yield s;
  }
  async function* streamChunks(chunks: string[]): AsyncGenerator<string> {
    for (const c of chunks) yield c;
  }
  async function* throwingStream(message: string): AsyncGenerator<string> {
    throw new Error(message);
    // eslint-disable-next-line no-unreachable
    yield "";
  }

  it("claude backend: batches lines and reports each by index", async () => {
    delete process.env.TRANSLATE_BACKEND;
    const run = vi.fn().mockResolvedValue("<t 0>hi</t>\n<t 2>world</t>");
    const { results, sink } = collect();
    await streamTranslations(content, sink, { run });
    expect(results).toEqual({ 0: "hi", 2: "world" });
    // Batched: a single runner call for both lines.
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("local backend: translates the whole text in one context-aware call", async () => {
    process.env.TRANSLATE_BACKEND = "local";
    // One streamed call carrying every line, so the model sees cross-line context.
    const runStream = vi.fn((_p: string) => streamOf("<t 0>hi</t>\n<t 2>world</t>"));
    const { results, sink } = collect();
    await streamTranslations(content, sink, { runStream });
    expect(results).toEqual({ 0: "hi", 2: "world" });
    expect(runStream).toHaveBeenCalledTimes(1);
    // The single prompt carries both lines, numbered, for context.
    expect(runStream.mock.calls[0][0]).toContain("0: hola");
    expect(runStream.mock.calls[0][0]).toContain("2: mundo");
  });

  it("emits each line as its tag closes while the pass streams", async () => {
    process.env.TRANSLATE_BACKEND = "local";
    // Split the batch response mid-tag across chunks; a line surfaces only once
    // its closing </t> has arrived.
    const runStream = vi.fn(() =>
      streamChunks(["<t 0>hi</t>\n<t 2>wor", "ld</t>"]),
    );
    const seenAt: Array<[number, number]> = [];
    let step = 0;
    await streamTranslations(content, (i, t) => {
      if (t !== null) seenAt.push([i, step++]);
    }, { runStream });
    // Line 0 lands before line 2 finishes assembling.
    expect(seenAt).toEqual([[0, 0], [2, 1]]);
  });

  it("reports an error for lines when the stream throws", async () => {
    process.env.TRANSLATE_BACKEND = "local";
    const runStream = vi.fn(() => throwingStream("boom"));
    const errors: string[] = [];
    await streamTranslations([content[0]], (_i, t, msg) => {
      if (t === null && msg) errors.push(msg);
    }, { runStream });
    expect(errors).toEqual(["boom"]);
  });

  it("reports missing lines the model dropped from the batch", async () => {
    process.env.TRANSLATE_BACKEND = "local";
    const runStream = vi.fn(() => streamOf("<t 0>hi</t>")); // line 2 never returned
    const results: Record<number, string | null> = {};
    const errs: Record<number, string | undefined> = {};
    await streamTranslations(content, (i, t, msg) => {
      results[i] = t;
      if (t === null) errs[i] = msg;
    }, { runStream });
    expect(results[0]).toBe("hi");
    expect(results[2]).toBeNull();
    expect(errs[2]).toBe("No translation returned.");
  });

  it("passes punctuation-only lines through without calling the model", async () => {
    process.env.TRANSLATE_BACKEND = "local";
    const runStream = vi.fn((_p: string) => streamOf("<t 1>x</t>"));
    const { results, sink } = collect();
    await streamTranslations(
      [
        { index: 0, text: "...", kind: "content" },
        { index: 1, text: "hola", kind: "content" },
      ],
      sink,
      { runStream },
    );
    expect(results[0]).toBe("...");
    expect(results[1]).toBe("x");
    expect(runStream).toHaveBeenCalledTimes(1); // only the real line
    expect(runStream.mock.calls[0][0]).not.toContain("..."); // punctuation never sent
  });
});
