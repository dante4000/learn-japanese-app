import test from "node:test";
import assert from "node:assert/strict";
import { storageConflictResponse } from "../src/lib/api-response";
import { StorageConflictError } from "../src/lib/store";

test("stale writes receive a retryable conflict response", async () => {
  const response = storageConflictResponse(new StorageConflictError());
  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), { error: "Data changed while saving. Refresh and try again." });
});

test("unexpected storage failures keep their original error", () => {
  const error = new Error("Storage unavailable");
  assert.throws(() => storageConflictResponse(error), (received) => received === error);
});
