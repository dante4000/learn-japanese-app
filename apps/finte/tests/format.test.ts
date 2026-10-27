import test from 'node:test';
import assert from 'node:assert/strict';
import { formatCompact } from '../src/lib/format';

test('compact axis amounts have explicit precision across server and browser ICU versions', () => {
  assert.deepEqual([0, 50, 100, 150, 1000, 1250].map((value) => formatCompact(value)), ['$0', '$50', '$100', '$150', '$1K', '$1.3K']);
});
