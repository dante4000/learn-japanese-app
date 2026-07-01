import { afterEach, describe, expect, it, vi } from "vitest";
import {
  aggregateCheck,
  buildStemBody,
  lalalSplitStems,
  toLalalStems,
  trackName,
} from "./lalal";

const proxy = (u: string) => `/api/stems/audio?url=${encodeURIComponent(u)}`;

describe("toLalalStems", () => {
  it("maps drums→drum, keeps phoenix stems, drops unknowns, dedupes", () => {
    expect(toLalalStems(["vocals", "drums", "synthesizer", "drums", "bogus"])).toEqual([
      "vocals",
      "drum",
      "synthesizer",
    ]);
  });
});

describe("buildStemBody", () => {
  it("shapes a stem_separator request with auto splitter", () => {
    expect(buildStemBody("src-1", "wind")).toEqual({
      source_id: "src-1",
      presets: { stem: "wind", splitter: "auto", extraction_level: "deep_extraction" },
      idempotency_key: null,
    });
  });
});

describe("trackName", () => {
  it("names no_vocals as Instrumental and other no_* as Backing", () => {
    expect(trackName("no_vocals")).toBe("Instrumental");
    expect(trackName("no_bass")).toBe("Backing");
    expect(trackName("synthesizer")).toBe("Synth");
  });
});

describe("aggregateCheck", () => {
  const success = (dur: number, tracks: object[]) => ({
    status: "success",
    result: { duration: dur, tracks },
  });

  it("keeps the backing track for a single-stem split (vox/inst)", () => {
    const r = aggregateCheck(
      {
        result: {
          t1: success(30, [
            { type: "stem", label: "vocals", url: "http://d.lalal.ai/a/vocals" },
            { type: "back", label: "no_vocals", url: "http://d.lalal.ai/a/no_vocals" },
          ]),
        },
      },
      ["t1"],
      proxy,
      true,
    );
    expect(r.status).toBe("success");
    if (r.status !== "success") return;
    expect(r.tracks.map((t) => t.name)).toEqual(["Vocals", "Instrumental"]);
  });

  it("drops backing tracks for a multi-stem split, in task order", () => {
    const r = aggregateCheck(
      {
        result: {
          t1: success(60, [
            { type: "stem", label: "drum", url: "http://d.lalal.ai/a/drum" },
            { type: "back", label: "no_drum", url: "http://d.lalal.ai/a/no_drum" },
          ]),
          t2: success(60, [
            { type: "stem", label: "bass", url: "http://d.lalal.ai/a/bass" },
            { type: "back", label: "no_bass", url: "http://d.lalal.ai/a/no_bass" },
          ]),
        },
      },
      ["t1", "t2"],
      proxy,
      false,
    );
    expect(r.status === "success" && r.tracks.map((t) => t.name)).toEqual([
      "Drums",
      "Bass",
    ]);
    expect(r.status === "success" && r.tracks.every((t) => t.type === "stem")).toBe(
      true,
    );
  });

  it("reports averaged progress while tasks are mixed", () => {
    const r = aggregateCheck(
      {
        result: {
          t1: { status: "success", result: { duration: 1, tracks: [] } },
          t2: { status: "progress", progress: 50 },
        },
      },
      ["t1", "t2"],
      proxy,
      false,
    );
    expect(r).toEqual({ status: "progress", progress: 75 });
  });

  it("treats a queued task (progress 0 / absent) as 0%", () => {
    const r = aggregateCheck(
      {
        result: {
          t1: { status: "success", result: { duration: 1, tracks: [] } },
        },
      },
      ["t1", "t2"],
      proxy,
      false,
    );
    // t2 absent → 0; (100 + 0)/2 = 50
    expect(r).toEqual({ status: "progress", progress: 50 });
  });

  it("surfaces the first task error", () => {
    const r = aggregateCheck(
      {
        result: {
          t1: { status: "progress", progress: 10 },
          t2: { status: "error", error: { detail: "Unable to detect wind" } },
        },
      },
      ["t1", "t2"],
      proxy,
      false,
    );
    expect(r).toEqual({ status: "error", error: "Unable to detect wind" });
  });

  it("maps server_error to a friendly retry message", () => {
    const r = aggregateCheck(
      { result: { t1: { status: "server_error", error: "gone" } } },
      ["t1"],
      proxy,
      true,
    );
    expect(r.status === "error" && /expired/i.test(r.error)).toBe(true);
  });

  it("returns unknown when all tasks are absent", () => {
    expect(aggregateCheck({ result: {} }, ["t1"], proxy, false)).toEqual({
      status: "unknown",
    });
  });

  it("keeps polling (progress) when only some tasks are momentarily absent", () => {
    const r = aggregateCheck(
      { result: { t1: { status: "progress", progress: 40 } } },
      ["t1", "t2"],
      proxy,
      false,
    );
    // t2 absent (transient) → treated as 0%, average = 20, not terminal.
    expect(r).toEqual({ status: "progress", progress: 20 });
  });
});

describe("lalalSplitStems rollback", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("cancels already-started tasks when one stem fails to start", async () => {
    process.env.LALAL_LICENSE = "test-key";
    const cancelBodies: string[] = [];
    let started = 0;
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith("/split/stem_separator/")) {
        started++;
        if (started === 2) {
          return new Response(JSON.stringify({ detail: "boom" }), { status: 400 });
        }
        return new Response(JSON.stringify({ task_id: `task-${started}` }), { status: 200 });
      }
      if (url.endsWith("/cancel/")) {
        cancelBodies.push(String(init?.body));
        return new Response("{}", { status: 200 });
      }
      throw new Error(`unexpected ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(lalalSplitStems("src", ["vocals", "drums", "bass"])).rejects.toThrow(
      /boom/,
    );
    // The two tasks that started must be cancelled (rollback).
    expect(cancelBodies).toHaveLength(1);
    const cancelled = JSON.parse(cancelBodies[0]).task_ids as string[];
    expect(cancelled.sort()).toEqual(["task-1", "task-3"]);
  });
});
