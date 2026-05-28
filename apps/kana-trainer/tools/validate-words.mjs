// Validate words-data.js: schema, dedupe, script-tag correctness, and a
// kana -> romaji transliteration consistency check (catches wrong readings).
// Hard errors exit non-zero; consistency mismatches are warnings (irregular
// readings exist). Usage: node tools/validate-words.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(__dirname, '..', 'words-data.js'), 'utf8');
const { WORDS, WORD_POS_ORDER } = new Function(src + '\nreturn { WORDS, WORD_POS_ORDER };')();

const LVL = new Set(['N5', 'N4', 'N3', 'N2', 'N1']);
const POS = new Set(WORD_POS_ORDER);
const cp = (c) => c.codePointAt(0);
const isKanji = (c) => (cp(c) >= 0x4e00 && cp(c) <= 0x9fff) || (cp(c) >= 0x3400 && cp(c) <= 0x4dbf) || c === '々';
const isHira = (c) => cp(c) >= 0x3041 && cp(c) <= 0x309f;
const isKata = (c) => (cp(c) >= 0x30a1 && cp(c) <= 0x30fa) || c === 'ー' || c === '・';

// --- kana -> romaji transliterator (Hepburn, long vowels spelled out) ---
const BASE = {
  あ:'a',い:'i',う:'u',え:'e',お:'o',
  か:'ka',き:'ki',く:'ku',け:'ke',こ:'ko',が:'ga',ぎ:'gi',ぐ:'gu',げ:'ge',ご:'go',
  さ:'sa',し:'shi',す:'su',せ:'se',そ:'so',ざ:'za',じ:'ji',ず:'zu',ぜ:'ze',ぞ:'zo',
  た:'ta',ち:'chi',つ:'tsu',て:'te',と:'to',だ:'da',ぢ:'ji',づ:'zu',で:'de',ど:'do',
  な:'na',に:'ni',ぬ:'nu',ね:'ne',の:'no',
  は:'ha',ひ:'hi',ふ:'fu',へ:'he',ほ:'ho',ば:'ba',び:'bi',ぶ:'bu',べ:'be',ぼ:'bo',ぱ:'pa',ぴ:'pi',ぷ:'pu',ぺ:'pe',ぽ:'po',
  ま:'ma',み:'mi',む:'mu',め:'me',も:'mo',
  や:'ya',ゆ:'yu',よ:'yo',
  ら:'ra',り:'ri',る:'ru',れ:'re',ろ:'ro',
  わ:'wa',を:'o',ん:'n',
  ぁ:'a',ぃ:'i',ぅ:'u',ぇ:'e',ぉ:'o',
};
const COMBO = {
  きゃ:'kya',きゅ:'kyu',きょ:'kyo',ぎゃ:'gya',ぎゅ:'gyu',ぎょ:'gyo',
  しゃ:'sha',しゅ:'shu',しょ:'sho',じゃ:'ja',じゅ:'ju',じょ:'jo',
  ちゃ:'cha',ちゅ:'chu',ちょ:'cho',ぢゃ:'ja',ぢゅ:'ju',ぢょ:'jo',
  にゃ:'nya',にゅ:'nyu',にょ:'nyo',ひゃ:'hya',ひゅ:'hyu',ひょ:'hyo',
  びゃ:'bya',びゅ:'byu',びょ:'byo',ぴゃ:'pya',ぴゅ:'pyu',ぴょ:'pyo',
  みゃ:'mya',みゅ:'myu',みょ:'myo',りゃ:'rya',りゅ:'ryu',りょ:'ryo',
  // katakana-specific extended combos
  ふぁ:'fa',ふぃ:'fi',ふぇ:'fe',ふぉ:'fo',てぃ:'ti',でぃ:'di',とぅ:'tu',どぅ:'du',
  うぃ:'wi',うぇ:'we',うぉ:'wo',ゔぁ:'va',ゔぃ:'vi',ゔ:'vu',ゔぇ:'ve',ゔぉ:'vo',
  しぇ:'she',ちぇ:'che',じぇ:'je',
};
// katakana -> hiragana so we reuse one table
function kataToHira(s) {
  let out = '';
  for (const c of s) {
    const code = cp(c);
    if (code >= 0x30a1 && code <= 0x30f6) out += String.fromCodePoint(code - 0x60);
    else out += c; // ー handled later
  }
  return out;
}
function lastVowel(roma) {
  const m = roma.match(/[aeiou](?!.*[aeiou])/);
  return m ? m[0] : '';
}
function kanaToRomaji(reading) {
  const h = kataToHira(reading);
  let out = '';
  for (let i = 0; i < h.length; i++) {
    const two = h.slice(i, i + 2);
    const one = h[i];
    if (one === 'ー') { out += lastVowel(out); continue; }
    if (one === 'っ') { // gemination: double next consonant
      const nx = COMBO[h.slice(i + 1, i + 3)] || BASE[h[i + 1]] || '';
      if (nx) out += nx[0] === 'c' ? 't' : nx[0]; // っちゃ -> tcha
      continue;
    }
    if (COMBO[two]) { out += COMBO[two]; i++; continue; }
    if (BASE[one]) { out += BASE[one]; continue; }
    out += '?'; // unknown kana -> forces a visible mismatch
  }
  return out;
}
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
