import { isAuthenticated } from "@/lib/auth";
import { decodeBackup, encodeBackup, planRestore } from "@/lib/backup";
import { listItemIds, loadItemBundle, loadMeta, saveItemBundle, saveMeta, reserveRestoredInstitution, StorageConflictError } from "@/lib/store";
import type { ItemBundle } from "@/lib/types";

async function readData() {
  const ids = await listItemIds();
  const [bundles, meta] = await Promise.all([Promise.all(ids.map(loadItemBundle)), loadMeta()]);
  if (bundles.some((b) => !b)) throw new Error("A connection changed during backup. Retry.");
  return { bundles: bundles as ItemBundle[], meta };
}

export async function GET() {
  if (!await isAuthenticated()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return new Response(encodeBackup(await readData()), { headers: { "Content-Type": "application/octet-stream", "Content-Disposition": `attachment; filename="finacetracker-${new Date().toISOString().slice(0, 10)}.backup"`, "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Could not create an encrypted backup. Check storage and the data key, then retry." }, { status: 503 }); }
}

export async function POST(request: Request) {
  if (!await isAuthenticated()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const raw = await request.text();
  if (Buffer.byteLength(raw) > 3_100_000) return Response.json({ error: "Backup exceeds the upload limit." }, { status: 413 });
  let body, archive;
  try {
    body = JSON.parse(raw);
    if (typeof body.backup !== "string" || !["preview", "restore"].includes(body.action)) throw new Error("Choose a backup and preview it first.");
    archive = decodeBackup(body.backup);
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Invalid backup" }, { status: 400 }); }
  const current = await readData();
  const plan = planRestore(current, archive);
  const preview = { fingerprint: plan.fingerprint, conflicts: plan.conflicts.slice(0, 100), conflictCount: plan.conflicts.length, newConnections: plan.newConnections, newTransactions: plan.newTransactions, manualEntries: plan.meta.manualEntries.length, baselines: plan.meta.baselines?.length ?? 0, snapshots: plan.meta.snapshots.length, createdAt: archive.createdAt };
  if (body.action === "preview") return Response.json(preview, { headers: { "Cache-Control": "no-store" } });
  if (body.fingerprint !== plan.fingerprint || plan.conflicts.length) return Response.json({ error: "Saved data or the restore plan changed. Preview again and resolve conflicts before restoring." }, { status: 409 });
  let completed = 0;
  try {
    for (const bundle of plan.bundles) {
      const previous = current.bundles.find((b) => b.item.id === bundle.item.id);
      if (JSON.stringify(previous) === JSON.stringify(bundle)) continue;
      if (!previous && bundle.item.institutionId) await reserveRestoredInstitution(bundle.item.institutionId, bundle.item.id);
      await saveItemBundle(bundle, previous ?? bundle);
      completed++;
    }
    await saveMeta({ ...current.meta, ...plan.meta });
    return Response.json({ ok: true, message: "Backup restored. Existing matching records were preserved. Updates can take up to a minute to appear." });
  } catch (error) {
    return Response.json({ error: `${completed ? `${completed} connection documents were restored. ` : ""}Restore did not finish. Preview again before retrying. ${error instanceof StorageConflictError ? "Saved data changed." : "Check storage availability."}`, partial: completed > 0 }, { status: 409 });
  }
}
