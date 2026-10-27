import test from "node:test";
import assert from "node:assert/strict";
import { scheduleSavedRefresh } from "../src/components/useSavedRefresh";

test("saved refresh retries immediately, at 10/30/65 seconds, then stops", (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  let calls = 0;
  scheduleSavedRefresh(() => calls++);
  assert.equal(calls, 1);
  context.mock.timers.tick(9_999); assert.equal(calls, 1);
  context.mock.timers.tick(1); assert.equal(calls, 2);
  context.mock.timers.tick(20_000); assert.equal(calls, 3);
  context.mock.timers.tick(30_000); assert.equal(calls, 3);
  context.mock.timers.tick(5_000); assert.equal(calls, 4);
  context.mock.timers.tick(120_000); assert.equal(calls, 4);
});

test("unmount cancellation removes all remaining refreshes", (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  let calls = 0;
  const cancel = scheduleSavedRefresh(() => calls++);
  context.mock.timers.tick(10_000); assert.equal(calls, 2);
  cancel(); cancel();
  context.mock.timers.tick(60_000); assert.equal(calls, 2);
});

test("a new save cancels the older retry schedule", (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  let calls = 0;
  const cancelFirst = scheduleSavedRefresh(() => calls++);
  context.mock.timers.tick(5_000);
  cancelFirst();
  const cancelSecond = scheduleSavedRefresh(() => calls++);
  assert.equal(calls, 2);
  context.mock.timers.tick(5_000); assert.equal(calls, 2);
  context.mock.timers.tick(5_000); assert.equal(calls, 3);
  context.mock.timers.tick(20_000); assert.equal(calls, 4);
  context.mock.timers.tick(35_000); assert.equal(calls, 5);
  cancelSecond();
});
