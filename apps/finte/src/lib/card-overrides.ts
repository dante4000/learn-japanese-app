import { CARD_CATALOG } from "./cards";

export type CardOverrides = Record<string, Record<string, Record<string, boolean>>>;

export function validCreditSlot(cardKey: unknown, creditName: unknown, slotKey: unknown): boolean {
  const card = CARD_CATALOG.find((c) => c.cardKey === cardKey);
  return Boolean(card?.credits.some((c) => c.name === creditName)) && typeof slotKey === "string" && /^(?:20\d{2}(?:-(?:0[1-9]|1[0-2]|Q[1-4]|H[12]))?|every4|ever)$/.test(slotKey);
}

export function validateCardOverrides(input: unknown): CardOverrides {
  if (!input || typeof input !== "object" || Array.isArray(input) || JSON.stringify(input).length > 150_000) throw new Error("Invalid credit corrections.");
  const result: CardOverrides = {};
  for (const [card, credits] of Object.entries(input)) {
    if (!CARD_CATALOG.some((c) => c.cardKey === card) || !credits || typeof credits !== "object" || Array.isArray(credits)) throw new Error("Unknown card correction.");
    result[card] = {};
    for (const [credit, slots] of Object.entries(credits)) {
      if (!CARD_CATALOG.find((c) => c.cardKey === card)?.credits.some((c) => c.name === credit)) throw new Error("Unknown credit correction.");
      if (!slots || typeof slots !== "object" || Array.isArray(slots)) throw new Error("Invalid credit slots.");
      result[card][credit] = {};
      for (const [slot, value] of Object.entries(slots)) {
        if (!validCreditSlot(card, credit, slot) || typeof value !== "boolean") throw new Error("Invalid credit correction.");
        result[card][credit][slot] = value;
      }
    }
  }
  return result;
}

/** Browser migration fills only absent slots; newer server choices win. */
export function mergeCardOverrides(saved: CardOverrides, incoming: CardOverrides): CardOverrides {
  const result = structuredClone(saved);
  for (const [card, credits] of Object.entries(incoming)) for (const [credit, slots] of Object.entries(credits)) {
    result[card] ??= {};
    result[card][credit] = { ...slots, ...result[card][credit] };
  }
  return result;
}
