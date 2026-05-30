// Validate kana-mnemonics.js: coverage + schema + example romaji consistency.
//   node tools/validate-mnemonics.mjs
// Hard errors exit non-zero. Coverage gap (a base single kana with no entry)
// is an error; a missing example is an error; example romaji must equal
// kanaToRomaji(word).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { kanaToRomaji } from './kana-romaji.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(__dirname, '..', 'kana-mnemonics.js'), 'utf8');
const { KANA_MNEMONICS } = new Function(src + '\nreturn { KANA_MNEMONICS };')();

// Every base single kana that the trainer can show (from app.js KANA groups).
const HIRAGANA = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん';
const KATAKANA = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
const BASE = [...HIRAGANA, ...KATAKANA];

const errors = [];

for (const k of BASE) {
  if (!KANA_MNEMONICS[k]) errors.push(`coverage: missing entry for ${k}`);
}

for (const [k, e] of Object.entries(KANA_MNEMONICS)) {
  if (!e.mnemonic || typeof e.mnemonic !== 'string') errors.push(`${k}: missing mnemonic`);
  if (!e.emoji) errors.push(`${k}: missing emoji`);
  if (!Array.isArray(e.examples) || e.examples.length < 1) errors.push(`${k}: needs >=1 example`);
  for (const ex of (e.examples || [])) {
    if (!ex.w || !ex.r || !ex.m) { errors.push(`${k}: example missing w/r/m (${JSON.stringify(ex)})`); continue; }
    const expect = kanaToRomaji(ex.w);
    if (expect !== String(ex.r).toLowerCase()) errors.push(`${k}: example ${ex.w} reads "${expect}" not "${ex.r}"`);
  }
  for (const c of (e.confusables || [])) {
    if (!c.k || !c.hint) errors.push(`${k}: confusable missing k/hint`);
  }
}

if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`OK: ${Object.keys(KANA_MNEMONICS).length} mnemonic entries valid (covers all ${BASE.length} base kana)`);
