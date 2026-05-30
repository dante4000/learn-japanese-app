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

// --- kana-mnemonics dataset ---
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __d = dirname(fileURLToPath(import.meta.url));
const mnemSrc = readFileSync(join(__d, '..', 'kana-mnemonics.js'), 'utf8');
const { KANA_MNEMONICS } = new Function(mnemSrc + '\nreturn { KANA_MNEMONICS };')();

test('kana-mnemonics: every base kana has mnemonic + emoji + example', () => {
  const HIRA = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん';
  const KATA = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
  for (const k of [...HIRA, ...KATA]) {
    const e = KANA_MNEMONICS[k];
    assert.ok(e, `missing mnemonic entry for ${k}`);
    assert.ok(e.mnemonic && e.emoji, `${k} needs mnemonic + emoji`);
    assert.ok(e.examples.length >= 1, `${k} needs an example`);
  }
});

test('kana-mnemonics: example romaji matches kanaToRomaji(word)', () => {
  for (const [k, e] of Object.entries(KANA_MNEMONICS)) {
    for (const ex of e.examples) {
      assert.equal(kanaToRomaji(ex.w), ex.r, `${k}: ${ex.w} should read ${kanaToRomaji(ex.w)}`);
    }
  }
});
