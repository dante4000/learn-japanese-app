import { splitLines, translateLine } from "@/lib/translate";

export const runtime = "nodejs";
export const maxDuration = 300;

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
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: unknown) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };

      for (const line of lines) {
        // Blank lines pass straight through to preserve stanza breaks.
        if (line.kind === "blank") {
          send({ type: "line", index: line.index, original: "", translation: "" });
          continue;
        }

        try {
          const translation = await translateLine(line.text);
          send({
            type: "line",
            index: line.index,
            original: line.text,
            translation,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Translation failed.";
          send({ type: "error", index: line.index, original: line.text, message });
        }
      }

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
