// Drives streamOllama through a fetch mock emitting real Ollama /api/generate
// NDJSON, chunked at awkward byte boundaries (mid-JSON-line and mid-<t> tag), to
// prove the wire parser reassembles lines/tags — the byte path the stubbed
// runStream unit tests bypass.
import { afterEach, describe, expect, it, vi } from "vitest";
import { streamOllama, translateAllLocal, type SourceLine } from "./translate";

function ndjson(...objs: object[]): string {
  return objs.map((o) => JSON.stringify(o)).join("\n") + "\n";
}

function bodyOf(chunks: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  let i = 0;
  return new ReadableStream({
    pull(controller) {
      if (i < chunks.length) controller.enqueue(enc.encode(chunks[i++]));
      else controller.close();
    },
  });
}

afterEach(() => vi.restoreAllMocks());

describe("streamOllama wire parsing (real byte path)", () => {
  it("reassembles NDJSON split across arbitrary chunk boundaries", async () => {
    // A full Ollama-style stream for a 2-line batch, then cut into ragged chunks.
    const full = ndjson(
      { model: "gemma3:27b", response: "<t 0>under the ", done: false },
      { model: "gemma3:27b", response: "full moon</t>\n<t 2>", done: false },
      { model: "gemma3:27b", response: "the river</t>", done: false },
      { model: "gemma3:27b", response: "", done: true, done_reason: "stop" },
    );
    // Slice the whole wire text into 7-byte chunks — boundaries land mid-JSON.
    const chunks: string[] = [];
    for (let p = 0; p < full.length; p += 7) chunks.push(full.slice(p, p + 7));

    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(bodyOf(chunks), { status: 200 })));

    let out = "";
    for await (const piece of streamOllama("prompt")) out += piece;
    expect(out).toBe("<t 0>under the full moon</t>\n<t 2>the river</t>");
  });

  it("translateAllLocal emits per index over the real streamOllama path", async () => {
    const full = ndjson(
      { response: "<t 0>hi</t>\n", done: false },
      { response: "<t 2>wor", done: false },
      { response: "ld</t>", done: false },
      { response: "", done: true },
    );
    const chunks: string[] = [];
    for (let p = 0; p < full.length; p += 5) chunks.push(full.slice(p, p + 5));
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(bodyOf(chunks), { status: 200 })));

    const lines: SourceLine[] = [
      { index: 0, text: "hola", kind: "content" },
      { index: 2, text: "mundo", kind: "content" },
    ];
    const seen: Array<[number, string | null]> = [];
    await translateAllLocal(lines, (i, t) => seen.push([i, t]));
    expect(seen).toEqual([[0, "hi"], [2, "world"]]);
  });

  it("surfaces a friendly error when Ollama is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("ECONNREFUSED"); }));
    await expect((async () => { for await (const _ of streamOllama("p")) void _; })())
      .rejects.toThrow(/Is Ollama running/);
  });

  it("maps a 404 to an install hint", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 404 })));
    await expect((async () => { for await (const _ of streamOllama("p")) void _; })())
      .rejects.toThrow(/not installed/);
  });
});
