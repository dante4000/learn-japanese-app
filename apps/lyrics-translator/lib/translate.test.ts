import { describe, expect, it, vi } from "vitest";
import {
  buildBatchPrompt,
  chunk,
  parseBatch,
  splitLines,
  translateBatch,
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
