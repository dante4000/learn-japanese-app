import { describe, expect, it, vi } from "vitest";
import { extractTranslation, splitLines, translateLine } from "./translate";

describe("splitLines", () => {
  it("returns [] for empty input", () => {
    expect(splitLines("")).toEqual([]);
  });

  it("classifies content and blank lines and preserves order", () => {
    const result = splitLines("hola\n\nmundo");
    expect(result).toEqual([
      { index: 0, text: "hola", kind: "content" },
      { index: 1, text: "", kind: "blank" },
      { index: 2, text: "mundo", kind: "content" },
    ]);
  });

  it("treats whitespace-only lines as blank", () => {
    expect(splitLines("a\n   \nb")[1].kind).toBe("blank");
  });

  it("drops exactly one trailing newline (no spurious empty line)", () => {
    expect(splitLines("solo\n")).toEqual([
      { index: 0, text: "solo", kind: "content" },
    ]);
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

describe("extractTranslation", () => {
  it("pulls the text out of <t></t> tags", () => {
    expect(extractTranslation("<t>Under the full moon</t>")).toBe("Under the full moon");
  });

  it("ignores surrounding preamble/chatter around the tags", () => {
    const raw = "Here is the translation:\n<t>the river carries my words</t>\nHope that helps!";
    expect(extractTranslation(raw)).toBe("the river carries my words");
  });

  it("falls back to the trimmed raw output when no tags are present", () => {
    expect(extractTranslation("  just text  ")).toBe("just text");
  });
});

describe("translateLine", () => {
  it("sends the line to the runner and extracts the tagged translation", async () => {
    const run = vi.fn().mockResolvedValue("<t>under the full moon</t>");
    const out = await translateLine("bajo la luna llena", { run });
    expect(out).toBe("under the full moon");
    expect(run.mock.calls[0][0]).toContain("bajo la luna llena");
  });

  it("recovers a clean line even when the model adds a preamble", async () => {
    const run = vi.fn().mockResolvedValue("Sure!\n\n<t>and the river</t>");
    expect(await translateLine("y el río", { run })).toBe("and the river");
  });
});
