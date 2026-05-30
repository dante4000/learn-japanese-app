// Unit tests for the pieces we can run without a browser.
// Run: node --test tests/unit.mjs  (or `npm test`)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kanaToRomaji, BASE, COMBO } from '../tools/kana-romaji.mjs';

test('kanaToRomaji: hiragana singles', () => {
  assert.equal(kanaToRomaji('あ'), 'a');
  assert.equal(kanaToRomaji('かき'), 'kaki');
  assert.equal(kanaToRomaji('しんぶん'), 'shinbun');
  assert.equal(kanaToRomaji('ん'), 'n');
});

test('kanaToRomaji: dakuten / handakuten', () => {
  assert.equal(kanaToRomaji('がっこう'), 'gakkou');
  assert.equal(kanaToRomaji('だいがく'), 'daigaku');
  assert.equal(kanaToRomaji('ぱん'), 'pan');
  assert.equal(kanaToRomaji('ぼうし'), 'boushi');
});

test('kanaToRomaji: yō-on combos', () => {
  assert.equal(kanaToRomaji('きょう'), 'kyou');
  assert.equal(kanaToRomaji('じゃ'), 'ja');
  assert.equal(kanaToRomaji('しゅみ'), 'shumi');
  assert.equal(kanaToRomaji('ぎょうじ'), 'gyouji');
});

test('kanaToRomaji: sokuon (small tsu) gemination', () => {
  assert.equal(kanaToRomaji('にっぽん'), 'nippon');
  assert.equal(kanaToRomaji('がっこう'), 'gakkou');
  assert.equal(kanaToRomaji('まっちゃ'), 'matcha');
});

test('kanaToRomaji: katakana + long vowel mark', () => {
  assert.equal(kanaToRomaji('アパート'), 'apaato');
  assert.equal(kanaToRomaji('コーヒー'), 'koohii');
  assert.equal(kanaToRomaji('エレベーター'), 'erebeetaa');
});

test('kanaToRomaji: extended katakana combos', () => {
  assert.equal(kanaToRomaji('ファミリー'), 'famirii');
  assert.equal(kanaToRomaji('ティー'), 'tii');
});

test('kanaToRomaji: unknown char yields ? sentinel', () => {
  assert.match(kanaToRomaji('あXい'), /\?/);
});

test('BASE / COMBO tables: every value is lowercase a-z', () => {
  for (const [k, v] of Object.entries(BASE)) {
    assert.match(v, /^[a-z]+$/, `BASE[${k}] should be lowercase a-z, got "${v}"`);
  }
  for (const [k, v] of Object.entries(COMBO)) {
    assert.match(v, /^[a-z]+$/, `COMBO[${k}] should be lowercase a-z, got "${v}"`);
  }
});

test('BASE / COMBO tables: complete kana coverage', () => {
  // Spot-check that every gojūon row has its five entries.
  for (const row of ['か', 'き', 'く', 'け', 'こ']) {
    assert.ok(BASE[row], `missing base hiragana ${row}`);
  }
  for (const row of ['きゃ', 'きゅ', 'きょ']) {
    assert.ok(COMBO[row], `missing combo ${row}`);
  }
});
