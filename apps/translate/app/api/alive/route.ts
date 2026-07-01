// Heartbeat endpoint for on-demand auto-shutdown. The page holds an EventSource
// open to this route; when the browser tab closes, the connection drops. Once no
// tabs remain (after a short grace period for refresh/navigation), the server
// exits — but only when launched on demand (TRANSLATE_AUTOEXIT=1), never in dev.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GRACE_MS = 6000;

// Module-level state persists for the life of the (single, local) server process.
let connections = 0;
let everConnected = false;
let shutdownTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleShutdownIfIdle() {
  if (process.env.TRANSLATE_AUTOEXIT !== "1") return;
  if (!everConnected || connections > 0) return;
  if (shutdownTimer) clearTimeout(shutdownTimer);
  shutdownTimer = setTimeout(() => {
    if (connections <= 0) process.exit(0);
  }, GRACE_MS);
}

export async function GET(req: Request) {
  connections++;
  everConnected = true;
  if (shutdownTimer) {
    clearTimeout(shutdownTimer);
    shutdownTimer = null;
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(": connected\n\n"));
      const ping = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(ping);
        }
      }, 15000);

      const onAbort = () => {
        clearInterval(ping);
        connections = Math.max(0, connections - 1);
        try {
          controller.close();
        } catch {}
        scheduleShutdownIfIdle();
      };
      req.signal.addEventListener("abort", onAbort);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store",
      Connection: "keep-alive",
    },
  });
}
