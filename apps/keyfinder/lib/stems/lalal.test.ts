import { describe, expect, it } from "vitest";
import {
  buildSplitBody,
  normalizeCheck,
  toLalalStems,
  type NormalizedCheck,
} from "./lalal";

const proxy = (u: string) => `/api/stems/audio?url=${encodeURIComponent(u)}`;

describe("toLalalStems", () => {
  it("maps drums to the singular LALAL enum and drops unknowns", () => {
    expect(toLalalStems(["vocals", "drums", "bogus"])).toEqual([
      "vocals",
      "drum",
    ]);
  });

  it("dedupes repeated stems", () => {
    expect(toLalalStems(["bass", "bass", "piano"])).toEqual(["bass", "piano"]);
  });
});

describe("buildSplitBody", () => {
  it("shapes the multistem request with auto splitter", () => {
    expect(buildSplitBody("src-1", ["vocals", "drums"])).toEqual({
      source_id: "src-1",
      presets: {
        stem_list: ["vocals", "drum"],
        splitter: "auto",
        extraction_level: "deep_extraction",
      },
      idempotency_key: null,
    });
  });
});

describe("normalizeCheck", () => {
  const id = "task-1";

  it("returns progress and clamps negatives", () => {
    const r = normalizeCheck(
      { result: { [id]: { status: "progress", progress: 42 } } },
      id,
      proxy,
    );
    expect(r).toEqual<NormalizedCheck>({ status: "progress", progress: 42 });
  });

  it("normalizes success and rewrites urls + human names", () => {
    const r = normalizeCheck(
      {
        result: {
          [id]: {
            status: "success",
            result: {
              duration: 180,
              tracks: [
                { type: "stem", label: "vocals", url: "http://d.lalal.ai/a/vocals" },
                {
                  type: "back",
                  label: "no_multistem",
                  url: "http://d.lalal.ai/a/no_multistem",
                },
              ],
            },
          },
        },
      },
      id,
      proxy,
    );
    expect(r.status).toBe("success");
    if (r.status !== "success") return;
    expect(r.duration).toBe(180);
    expect(r.tracks).toEqual([
      {
        label: "vocals",
        name: "Vocals",
        type: "stem",
        url: proxy("http://d.lalal.ai/a/vocals"),
      },
      {
        label: "no_multistem",
        name: "Backing",
        type: "back",
        url: proxy("http://d.lalal.ai/a/no_multistem"),
      },
    ]);
  });

  it("labels a single-stem backing track (no_bass) as Backing", () => {
    const r = normalizeCheck(
      {
        result: {
          [id]: {
            status: "success",
            result: {
              duration: 8,
              tracks: [
                { type: "stem", label: "bass", url: "http://d.lalal.ai/a/bass" },
                { type: "back", label: "no_bass", url: "http://d.lalal.ai/a/no_bass" },
              ],
            },
          },
        },
      },
      id,
      proxy,
    );
    expect(r.status === "success" && r.tracks[1].name).toBe("Backing");
  });

  it("drops tracks without a url", () => {
    const r = normalizeCheck(
      {
        result: {
          [id]: {
            status: "success",
            result: { duration: 1, tracks: [{ type: "stem", label: "bass" }] },
          },
        },
      },
      id,
      proxy,
    );
    expect(r.status === "success" && r.tracks).toEqual([]);
  });

  it("surfaces task error detail", () => {
    const r = normalizeCheck(
      {
        result: {
          [id]: {
            status: "error",
            error: { detail: "Unable to detect vocals", code: "inference_error" },
          },
        },
      },
      id,
      proxy,
    );
    expect(r).toEqual<NormalizedCheck>({
      status: "error",
      error: "Unable to detect vocals",
    });
  });

  it("maps server_error to a friendly retry message", () => {
    const r = normalizeCheck(
      { result: { [id]: { status: "server_error", error: "gone" } } },
      id,
      proxy,
    );
    expect(r.status).toBe("error");
    if (r.status === "error") expect(r.error).toMatch(/expired/i);
  });

  it("returns unknown when the task id is absent", () => {
    expect(normalizeCheck({ result: {} }, id, proxy)).toEqual({
      status: "unknown",
    });
  });
});
