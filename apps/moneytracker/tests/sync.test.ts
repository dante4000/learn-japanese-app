import test from "node:test";
import assert from "node:assert/strict";
import { buildBundle } from "../src/lib/sync";
import { emptySyncResult } from "../src/lib/providers/types";
import type { Item, ItemBundle, RecurringStream } from "../src/lib/types";

const item: Item = {
  id: "test_item", provider: "plaid", institutionName: "Test bank",
  accessTokenEnc: "", cursor: null, status: "healthy", error: null,
  lastSyncedAt: null, createdAt: "2026-01-01",
};
const stream = { id: "test_stream" } as RecurringStream;
const previous: ItemBundle = { item, accounts: [], transactions: [], recurring: [stream] };

test("a failed recurring refresh preserves saved streams", () => {
  const result = { ...emptySyncResult(), recurring: null };
  assert.deepEqual(buildBundle(item, previous, result).recurring, [stream]);
});

test("a successful empty recurring refresh clears saved streams", () => {
  assert.deepEqual(buildBundle(item, previous, emptySyncResult()).recurring, []);
});
