import { CHUNK_SIZE, chunk, splitLines, translateBatch } from "@/lib/translate";

export const runtime = "nodejs";
export const maxDuration = 300;

const CONCURRENCY = 4; // chunks translated in parallel

interface TranslateBody {
  text?: unknown;
}

export async function POST(req: Request) {
  let body: TranslateBody;
  try {
    body = (await req.json()) as TranslateBody;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text : "";
  if (text.trim() === "") {
    return Response.json({ error: "No text provided." }, { status: 400 });
  }

  const lines = splitLines(text);
  const content = lines.filter((l) => l.kind === "content");
  const chunks = chunk(content, CHUNK_SIZE);
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: unknown) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };

      // 1) Instant skeleton: every line's original + shape, rendered immediately.
      send({
        type: "init",
        lines: lines.map((l) => ({
          index: l.index,
          original: l.text,
          blank: l.kind === "blank",
        })),
      });

      // 2) Translate chunks with bounded concurrency; stream each line as its
      //    chunk returns. Ordering is handled client-side by index.
      let cursor = 0;
      async function worker() {
        for (;;) {
          const myChunk = chunks[cursor++];
          if (!myChunk) return;
          try {
            const map = await translateBatch(myChunk);
            for (const line of myChunk) {
              const translation = map.get(line.index);
              if (translation !== undefined) {
                send({ type: "translated", index: line.index, translation });
              } else {
                send({ type: "error", index: line.index, message: "No translation returned." });
              }
            }
          } catch (err) {
            const message = err instanceof Error ? err.message : "Translation failed.";
            for (const line of myChunk) send({ type: "error", index: line.index, message });
          }
        }
      }

      await Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, chunks.length) }, worker),
      );

      send({ type: "done", count: lines.length });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
