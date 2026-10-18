import { NextResponse } from "next/server";
import { StorageConflictError } from "./store";

/** Format optimistic-write conflicts. Preserve unexpected failures for server handling. */
export function storageConflictResponse(error: unknown): NextResponse {
  if (!(error instanceof StorageConflictError)) throw error;
  return NextResponse.json(
    { error: "Data changed while saving. Refresh and try again." },
    { status: 409 },
  );
}
