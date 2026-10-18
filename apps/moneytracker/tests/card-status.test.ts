import test from "node:test";
import assert from "node:assert/strict";
import { cardStatus } from "../src/lib/cards";
import { emptyState, type Account } from "../src/lib/types";

const account = { availability: "reported" } as Account;

test("confirmed Reserve closure overrides a linked account without an invented closure date", () => {
  const state = emptyState();
  assert.equal(cardStatus(state, "sapphire-reserve", account), "closed");
  state.cardStatuses = { "sapphire-reserve": "active" };
  assert.equal(cardStatus(state, "sapphire-reserve", account), "active");
});

test("only linked reported cards qualify for current totals", () => {
  const state = emptyState();
  assert.equal(cardStatus(state, "bilt-obsidian", account), "active");
  assert.equal(cardStatus(state, "bilt-obsidian"), "unlinked");
  assert.equal(cardStatus(state, "bilt-obsidian", { ...account, availability: "unavailable" }), "unavailable");
  state.cardStatuses = { "bilt-obsidian": "closed" };
  assert.equal(cardStatus(state, "bilt-obsidian", account), "closed");
  state.cardStatuses = { "bilt-obsidian": "active" };
  assert.equal(cardStatus(state, "bilt-obsidian"), "unlinked");
});
