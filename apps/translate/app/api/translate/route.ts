import { splitLines, streamTranslations } from "@/lib/translate";

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
  const content = lines.filter((l) => l.kind === "content");
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

      // 2) Translate via the active backend, streaming each line as it lands.
      await streamTranslations(content, (index, translation, message) => {
        if (translation !== null) send({ type: "translated", index, translation });
        else send({ type: "error", index, message: message ?? "Translation failed." });
      });

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
