// Canonical kana → romaji transliterator (Hepburn, long vowels spelled out).
// Single source of truth — imported by tools/validate-words.mjs and tests/unit.mjs.

const cp = (c) => c.codePointAt(0);

export const BASE = {
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

export const COMBO = {
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

export function kataToHira(s) {
  let out = '';
  for (const c of s) {
    const code = cp(c);
    if (code >= 0x30a1 && code <= 0x30f6) out += String.fromCodePoint(code - 0x60);
    else out += c;
  }
  return out;
}

function lastVowel(roma) {
  const m = roma.match(/[aeiou](?!.*[aeiou])/);
  return m ? m[0] : '';
}

export function kanaToRomaji(reading) {
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
    out += '?';
  }
  return out;
}
