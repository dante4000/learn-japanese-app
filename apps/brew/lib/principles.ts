// Cause → effect levers, synthesized from Korean-language brewing sources
// (술독, 막걸리학교/허시명, RDA, 한국민족문화대백과, KJFP/koreascience, 나무위키).
// The through-line: sweetness vs dryness is a race between 당화 (starch→sugar)
// and 발효 (sugar→alcohol); clean+strong both come from keeping yeast dominant.

export type Lever = {
  id: string;
  ko: string; // seal glyph
  korean: string; // korean term
  name: string; // english title
  effect: string; // headline
  points: { k: string; v: string }[];
};

export const principles: Lever[] = [
  {
    id: "temp",
    ko: "溫",
    korean: "발효 온도",
    name: "Temperature",
    effect:
      "The master dial. Cool ferments run dry, clean and strong; hot ones go sweet, sour and rough.",
    points: [
      {
        k: "저온 (≤ 25 °C)",
        v: "Yeast stays dominant and ferments to completion → higher ABV, dry, clean, less hangover. Slower but stable. The reason 삼해주 is brewed at 10–15 °C.",
      },
      {
        k: "고온 (> 28 °C)",
        v: "초산균 (acetic bacteria) overtake the yeast → 신맛, 잡미, more methanol/fusel alcohols, worse hangover, and stalls that finish sweet.",
      },
      {
        k: "품온 관리",
        v: "Hold the mash temperature, not just the room; shed heat (remove the blanket / stir) once it self-heats past ~25 °C.",
      },
    ],
  },
  {
    id: "water",
    ko: "水",
    korean: "물 비율 (가수)",
    name: "Water ratio",
    effect:
      "Sets strength and guards against sourness. The rule of thumb: never more than 150% of the rice.",
    points: [
      {
        k: "물 적게 (≤ 150%)",
        v: "Higher ABV, fuller body, more stable ferment. Strong 원주 lands ~16–20%.",
      },
      {
        k: "물 많이 (> 150%)",
        v: "허시명’s rule: 물이 너무 많으면 신맛이 많이 난다 — too much water thins the body and invites souring.",
      },
      {
        k: "후수 (dilution)",
        v: "Strength is also set at the end: a 16–20% 원주 cut 1:1 with water becomes a 6–8% table makgeolli.",
      },
    ],
  },
  {
    id: "ricetype",
    ko: "米",
    korean: "멥쌀 vs 찹쌀",
    name: "Rice type",
    effect: "Non-glutinous for dry and sharp; glutinous for sweet and rich.",
    points: [
      {
        k: "멥쌀 (non-glutinous)",
        v: "Breaks down fully → sugar nearly all converts to alcohol → dry, high-ABV, even 맵다 (sharp). The choice for clean dry wines.",
      },
      {
        k: "찹쌀 (glutinous)",
        v: "Enzymes can’t fully break it down → residual sweetness, viscosity and 감칠맛 (umami) remain. Usually saved for the 덧술.",
      },
    ],
  },
  {
    id: "form",
    ko: "炊",
    korean: "쌀 가공 형태",
    name: "Rice form",
    effect:
      "죽 → 범벅 → 구멍떡 → 백설기 → 고두밥, wettest to driest. Drives body and clarity — not, surprisingly, the final ABV.",
    points: [
      {
        k: "죽 / 범벅 (wet, fine)",
        v: "Enzymes reach the starch easily → faster 당화, more sweetness, thicker body, easier to press. Best for the 밑술.",
      },
      {
        k: "고두밥 (dry, whole-grain)",
        v: "Slow, gradual ferment → clean, lean (담백) profile and a clearer wine. Best for the 덧술 / final feed.",
      },
      {
        k: "the finding",
        v: "Same recipe, different forms: ABV came out the same; only body, sweetness and clarity changed.",
      },
    ],
  },
  {
    id: "nuruk",
    ko: "麯",
    korean: "누룩",
    name: "Nuruk",
    effect:
      "More converts harder but muddies; less runs cleaner but can stall. Curing it is how you get both.",
    points: [
      {
        k: "많이 / 적게",
        v: "이화주 rule: rich & sweet → 7되 per 말 of rice; clear & strong → only 3–4되. More nuruk = stronger funk (누룩취) and darker colour.",
      },
      {
        k: "법제 + 수곡",
        v: "Cure it (3 days, sun by day / dew by night) and steep it as 수곡 (water-nuruk) to erase 누룩취 and clarify — without cutting the dose.",
      },
      {
        k: "분곡 / 입국",
        v: "Bran-sieved wheat 분곡 → pale, near-colourless wine; the mould sets the colour (황곡 → gold, 백곡 → clear).",
      },
    ],
  },
  {
    id: "stages",
    ko: "釀",
    korean: "담금 횟수",
    name: "Number of brews",
    effect:
      "단양 → 이양 → 삼양 → 오양. Each added 덧술 raises strength and depth — and, counter-intuitively, lowers the failure rate.",
    points: [
      {
        k: "more stages → more ABV",
        v: "Each feeding tops up an already-huge, alcohol-tolerant yeast colony, so it keeps converting toward the ~18–20% ceiling.",
      },
      {
        k: "more stages → cleaner & deeper",
        v: "Staged feeding gives depth, fruit/flower aroma and a cleaner finish, and lets you use less nuruk for the same strength.",
      },
      {
        k: "more stages → safer",
        v: "삼양주 이상 lowers the failure rate and improves keeping quality — the big yeast population out-competes 잡균.",
      },
    ],
  },
  {
    id: "aging",
    ko: "熟",
    korean: "숙성 · 채주",
    name: "Aging & drawing",
    effect: "Where clarity, smoothness and colour are decided.",
    points: [
      {
        k: "저온 숙성 (0–4 °C)",
        v: "Lees settle, the wine clears, and 잡미 / oxidative browning are held off. Longer aging rounds everything out.",
      },
      {
        k: "용수 vs 압착",
        v: "Sink a 용수 basket and ladle the clear top wine → 청주 / 약주; press the whole mash → cloudy 탁주 / 막걸리.",
      },
    ],
  },
  {
    id: "yeast",
    ko: "酵",
    korean: "효모 · 산도",
    name: "Yeast & acidity",
    effect:
      "Sets the ceiling and the safety margin. A sour, low-pH 밑술 is your steriliser.",
    points: [
      {
        k: "the ~18–20% ceiling",
        v: "Fermentation self-terminates near 20° as alcohol disables the yeast — the natural cap for any undistilled 전통주.",
      },
      {
        k: "젖산 (lactic acid)",
        v: "A low-pH start (≈ pH 3.0–3.2) lets acid-tolerant yeast thrive while 잡균 / spoilage organisms can’t — safety by acidity, not heat.",
      },
      {
        k: "밑술 = 효모 배양",
        v: "The seed mash exists to mass-grow yeast before the real ferment; a dense early bloom is what later out-competes contaminants.",
      },
    ],
  },
];

export const masterRules: string[] = [
  "단맛 vs dry is timing: sweet = stop early / cool / 찹쌀 / wet forms / more nuruk; dry = finish fully / 멥쌀 / 고두밥 / cold-to-completion.",
  "신맛 has three triggers — too much water (> 150%), too high a temperature (초산균), and a slow yeast start (잡균 takeover). Fix with less water, ~25 °C, and a strong 밑술.",
  "Clean and strong arrive together: 저온 + staged 담금 + an acidified 밑술 all do the same thing — keep the yeast in charge.",
];
