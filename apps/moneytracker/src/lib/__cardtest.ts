// Temporary verification harness for cards.ts pure functions. Run:
//   npx tsx src/lib/__cardtest.ts
// Deleted in the final task (no test runner is configured).
import { tokenize, bestHintMatchLen } from "./cards";

let failed = 0;
function eq(name: string, got: unknown, want: unknown) {
  const g = JSON.stringify(got);
  const w = JSON.stringify(want);
  if (g !== w) {
    failed++;
    console.error(`FAIL ${name}\n  got:  ${g}\n  want: ${w}`);
  } else {
    console.log(`ok   ${name}`);
  }
}

// tokenize
eq("tokenize splits on non-alnum", tokenize("APPLE.COM/BILL"), ["apple", "com", "bill"]);
eq("tokenize lowercases", tokenize("Uber One"), ["uber", "one"]);

// bestHintMatchLen: whole-token only
eq("apple does NOT match applebee's", bestHintMatchLen(tokenize("Applebee's Grill"), ["apple"]), 0);
eq("max does NOT match CarMax", bestHintMatchLen(tokenize("CARMAX 0123"), ["max"]), 0);
eq("clear does NOT match Clearwater", bestHintMatchLen(tokenize("Clearwater Pool"), ["clear"]), 0);
eq("apple matches apple.com/bill", bestHintMatchLen(tokenize("APPLE.COM/BILL"), ["apple"]), 5);
eq("multiword uber one matches", bestHintMatchLen(tokenize("UBER ONE membership"), ["uber one"]), 7);
eq("uber one charge: longest of uber/uber one is uber one", bestHintMatchLen(tokenize("UBER ONE"), ["uber", "uber one"]), 7);
eq("plain uber ride: only uber matches", bestHintMatchLen(tokenize("UBER TRIP help.uber.com"), ["uber", "uber one"]), 4);

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
