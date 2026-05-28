// Validate words-data.js: schema, dedupe, script-tag correctness, and a
// kana -> romaji transliteration consistency check (catches wrong readings).
// Hard errors exit non-zero; consistency mismatches are warnings (irregular
// readings exist). Usage: node tools/validate-words.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { kanaToRomaji } from './kana-romaji.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(__dirname, '..', 'words-data.js'), 'utf8');
const { WORDS, WORD_POS_ORDER } = new Function(src + '\nreturn { WORDS, WORD_POS_ORDER };')();

const LVL = new Set(['N5', 'N4', 'N3', 'N2', 'N1']);
const POS = new Set(WORD_POS_ORDER);
const cp = (c) => c.codePointAt(0);
const isKanji = (c) => (cp(c) >= 0x4e00 && cp(c) <= 0x9fff) || (cp(c) >= 0x3400 && cp(c) <= 0x4dbf) || c === '々';
const isHira = (c) => cp(c) >= 0x3041 && cp(c) <= 0x309f;
const isKata = (c) => (cp(c) >= 0x30a1 && cp(c) <= 0x30fa) || c === 'ー' || c === '・';
// loose compare: ignore long-vowel spelling + n/m before labials
function normRoma(s) {
  return String(s).toLowerCase()
    .replace(/ō|ô/g, 'ou').replace(/ū|û/g, 'uu').replace(/ā|â/g, 'aa').replace(/ī|î/g, 'ii').replace(/ē|ê/g, 'ee')
    .replace(/m([bpm])/g, 'n$1')
    .replace(/[^a-z]/g, '');
}
function looseEqual(a, b) {
  a = normRoma(a); b = normRoma(b);
  if (a === b) return true;
  // collapse doubled vowels both ways (ou==o, uu==u) for tolerance
  const collapse = (x) => x.replace(/([aeiou])\1+/g, '$1').replace(/ou/g, 'o').replace(/ei/g, 'e');
  return collapse(a) === collapse(b);
}

const errors = [], warns = [], seen = new Map();
WORDS.forEach((e, i) => {
  for (const k of ['w', 'r', 'o', 'm', 'lvl', 'pos', 's']) {
    if (typeof e[k] !== 'string' || !e[k]) errors.push(`#${i} ${e.w || '?'}: missing/empty "${k}"`);
  }
  if (!LVL.has(e.lvl)) errors.push(`#${i} ${e.w}: bad lvl "${e.lvl}"`);
  if (!POS.has(e.pos)) errors.push(`#${i} ${e.w}: bad pos "${e.pos}"`);

  const chars = [...(e.w || '')];
  const expected = chars.some(isKanji) ? 'kanji'
    : chars.length && chars.every(isKata) ? 'katakana'
    : chars.length && chars.every((c) => isHira(c) || isKata(c)) ? 'hiragana'
    : null;
  if (expected && e.s !== expected) warns.push(`#${i} ${e.w}: s="${e.s}" but looks like "${expected}"`);

  if (e.r && ![...e.r].every((c) => isHira(c) || isKata(c))) warns.push(`#${i} ${e.w}: reading "${e.r}" has non-kana`);

  if (e.r && e.o) {
    const got = kanaToRomaji(e.r);
    if (got.includes('?')) warns.push(`#${i} ${e.w}: reading "${e.r}" has untransliterable kana`);
    else if (!looseEqual(got, e.o)) warns.push(`#${i} ${e.w}: reading "${e.r}" -> "${got}" != romaji "${e.o}"`);
  }

  const id = (e.w || '') + '|' + (e.r || '');
  if (seen.has(id)) errors.push(`dup "${id}" at #${i} and #${seen.get(id)}`);
  else seen.set(id, i);
});

console.log(`Total entries: ${WORDS.length}`);
console.log('By level: ', ['N5','N4','N3','N2','N1'].map((l) => `${l}:${WORDS.filter((w) => w.lvl === l).length}`).join('  '));
console.log('By script:', ['kanji','hiragana','katakana'].map((s) => `${s}:${WORDS.filter((w) => w.s === s).length}`).join('  '));
console.log('By pos:   ', WORD_POS_ORDER.map((p) => `${p}:${WORDS.filter((w) => w.pos === p).length}`).join('  '));
if (warns.length) {
  console.warn(`\n${warns.length} WARNINGS (review; irregular readings may be legit):`);
  warns.slice(0, 60).forEach((w) => console.warn('  ' + w));
  if (warns.length > 60) console.warn(`  …and ${warns.length - 60} more`);
}
if (errors.length) {
  console.error(`\n${errors.length} ERRORS:`);
  errors.slice(0, 80).forEach((e) => console.error('  ' + e));
  process.exit(1);
}
console.log('\nOK — no hard errors.');
