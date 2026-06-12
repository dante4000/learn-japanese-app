import { recipes } from "@/lib/recipes";
import { principles, masterRules } from "@/lib/principles";
import RecipeCalculator from "./components/RecipeCalculator";
import { BrewProvider } from "./components/BrewProvider";

export default function Home() {
  return (
    <BrewProvider>
    <main className="relative">
      {/* ============ NAV ============ */}
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--paper)]/85 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-8">
          <a href="#top" className="flex items-baseline gap-2">
            <span className="kr text-xl font-bold">양조</span>
            <span className="hidden text-[0.7rem] tracky text-[var(--ink-faint)] sm:inline">
              a brewing journal
            </span>
          </a>
          <nav className="flex items-center gap-4 text-[0.72rem] tracky sm:gap-6">
            <a href="#principles" className="inklink">
              Principles
            </a>
            <a href="#oyangju" className="inklink">
              Recipes
            </a>
            <a href="#rescue" className="inklink">
              Rescue
            </a>
          </nav>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section
        id="top"
        className="relative mx-auto max-w-6xl px-5 pb-16 pt-16 sm:px-8 sm:pb-24 sm:pt-24"
      >
        <div className="rise flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <span className="seal kr px-3 py-2 text-base">釀</span>
            <span className="eyebrow text-base">
              Korean rice wine — from a stuck pot to the old, prized wines
            </span>
          </div>

          <h1 className="display text-[clamp(3.2rem,12vw,9rem)] font-black leading-[0.86] tracking-tight">
            <span className="kr">양조</span>
            <span className="block font-light italic text-[clamp(1.4rem,4vw,2.6rem)] text-[var(--ink-soft)]">
              the brewing book
            </span>
          </h1>

          <p className="max-w-2xl text-lg leading-relaxed text-[var(--ink-soft)] sm:text-xl">
            A working notebook for makgeolli and the wines beyond it. First, how
            to thin and strengthen a brew that came out thick. Then three of the
            great old recipes — <span className="kr">오양주</span>,{" "}
            <span className="kr">삼해주</span>,{" "}
            <span className="kr">석탄주</span> — drawn from the classical{" "}
            <span className="italic">고문헌</span> and built to scale.{" "}
            <strong className="font-semibold text-[var(--ink)]">
              Change the rice or the nuruk and every stage re-calculates.
            </strong>
          </p>

          <div className="mt-2 flex flex-wrap gap-3 text-[0.72rem] tracky">
            {recipes.map((r) => (
              <a
                key={r.id}
                href={`#${r.id}`}
                className="pill rounded-full px-4 py-2"
              >
                <span className="kr text-sm">{r.name}</span>
                <span className="ml-2 text-[var(--ink-faint)]">
                  {r.abv.replace("≈ ", "").split(" ·")[0]}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="double-rule" />
      </div>

      {/* ============ RECIPES ============ */}
      {recipes.map((r, idx) => (
        <section
          key={r.id}
          id={r.id}
          className="scroll-mt-20 border-t border-[var(--line)]"
          style={{
            background:
              idx % 2 === 1
                ? "linear-gradient(180deg, rgba(44,58,87,0.05), transparent 30%)"
                : "transparent",
          }}
        >
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
            {/* recipe header */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-[0.72rem] tracky text-[var(--ink-faint)]">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="h-px w-12"
                    style={{ background: "var(--line)" }}
                  />
                  <span className="eyebrow">
                    {r.roman} <span className="kr">· {r.category}</span>
                  </span>
                </div>
                <h2 className="display mt-3 flex items-baseline gap-4 text-[clamp(2.6rem,8vw,5.5rem)] font-black leading-none">
                  <span className="kr">{r.name}</span>
                  <span
                    className="kr text-[clamp(1rem,3vw,2rem)] font-normal"
                    style={{ color: accentHex(r.accent) }}
                  >
                    {r.hanja}
                  </span>
                </h2>
                <p className="mt-4 max-w-xl text-lg italic text-[var(--ink-soft)]">
                  {r.tagline}
                </p>
                <div className="mt-3">
                  <span
                    className="inline-block rounded-full px-3 py-1 text-[0.66rem] tracky"
                    style={{
                      border: `1.5px solid ${accentHex(r.accent)}`,
                      color: accentHex(r.accent),
                    }}
                  >
                    {r.profile}
                  </span>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-[0.9rem] lg:text-right">
                <Spec k="Stages" v={r.stagesLabel} wide />
                <Spec k="Strength" v={r.abv} />
                <Spec k="Nuruk" v={r.nurukPct} />
                <Spec k="Ferment" v={r.ferment} wide />
                <Spec k="Water" v={r.waterNote} wide />
              </dl>
            </div>

            <div className="my-9 rule" />

            {/* about / taste / method */}
            <div className="grid gap-x-12 gap-y-8 md:grid-cols-3">
              <Prose ko="유래" title="History">
                {r.about}
              </Prose>
              <Prose ko="맛" title="Taste & aroma">
                {r.taste}
              </Prose>
              <div>
                <ProseHead ko="비법" title="Method" />
                <ul className="mt-3 space-y-2.5">
                  {r.method.map((m, i) => (
                    <li
                      key={i}
                      className="flex gap-3 text-[0.95rem] leading-relaxed"
                    >
                      <span
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: accentHex(r.accent) }}
                      />
                      <span className="text-[var(--ink-soft)]">{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* the calculator */}
            <div className="mt-12">
              <div className="mb-5 flex items-center gap-3">
                <span className="kr text-sm tracky text-[var(--ink-faint)]">
                  분량 계산 · the scaler
                </span>
                <span
                  className="h-px flex-1"
                  style={{ background: "var(--line)" }}
                />
              </div>
              <RecipeCalculator recipe={r} />
            </div>
          </div>
        </section>
      ))}

      {/* ============ PRINCIPLES ============ */}
      <section
        id="principles"
        className="scroll-mt-20 border-t border-[var(--line)]"
        style={{
          background:
            "linear-gradient(180deg, rgba(178,122,35,0.06), transparent 28%)",
        }}
      >
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <SectionHead
            n="原理"
            ko="원리"
            title="Principles of flavor"
            sub="What moves the wine — strong, dry, clean"
          />
          <p className="mt-6 max-w-2xl text-[1.02rem] leading-relaxed text-[var(--ink-soft)]">
            Every old recipe is the same handful of dials set differently.
            Sweetness versus dryness is a race between{" "}
            <span className="kr">당화</span> (starch → sugar) and{" "}
            <span className="kr">발효</span> (sugar → alcohol); strength and
            cleanliness both come down to keeping the yeast in charge. Here is
            what each lever does, drawn from Korean sources.
          </p>

          <div className="mt-12 grid gap-x-10 gap-y-12 md:grid-cols-2">
            {principles.map((lev) => (
              <div key={lev.id} className="flex gap-5">
                <div className="flex flex-col items-center">
                  <span className="seal kr h-11 w-11 shrink-0 text-lg">
                    {lev.ko}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-3">
                    <h3 className="display text-2xl font-bold">{lev.name}</h3>
                    <span className="kr text-sm text-[var(--ink-faint)]">
                      {lev.korean}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[0.98rem] italic leading-snug text-[var(--ink-soft)]">
                    {lev.effect}
                  </p>
                  <dl className="mt-4 space-y-2.5">
                    {lev.points.map((p, i) => (
                      <div
                        key={i}
                        className="border-l-2 pl-3.5"
                        style={{ borderColor: "var(--line)" }}
                      >
                        <dt className="kr text-[0.86rem] font-semibold">
                          {p.k}
                        </dt>
                        <dd className="text-[0.9rem] leading-relaxed text-[var(--ink-soft)]">
                          {p.v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14 card rounded-lg p-6 sm:p-8">
            <h3 className="kr text-sm tracky text-[var(--ink-faint)]">
              한 줄 원칙 · the through-lines
            </h3>
            <ul className="mt-4 space-y-3">
              {masterRules.map((m, i) => (
                <li key={i} className="flex gap-3 text-[0.98rem] leading-relaxed">
                  <span className="amt text-xl text-[var(--vermilion)]">
                    {i + 1}
                  </span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ============ RESCUE GUIDE ============ */}
      <section
        id="rescue"
        className="mx-auto max-w-6xl scroll-mt-20 border-t border-[var(--line)] px-5 py-16 sm:px-8 sm:py-24"
      >
        <SectionHead
          n="00"
          ko="살림"
          title="Rescuing a thick brew"
          sub="When the strained wine comes out like porridge"
        />

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5 text-[1.02rem] leading-relaxed">
            <p>
              A brew that strains out{" "}
              <span className="kr">걸쭉 / 죽처럼 되직</span> — thick, weak, and a
              touch tangy — is the textbook sign of{" "}
              <span className="kr font-semibold">당화 부족</span>: incomplete
              saccharification. The rice starch never fully converted, so it
              stays thick <em>and</em> the yeast had little sugar to turn into
              alcohol. Korean sources are blunt that a thick, under-fermented
              mash will not separate into clear <span className="kr">청주</span>{" "}
              at all.
            </p>
            <p>
              The fix solves both problems at once. Finish the conversion and the
              body thins as the alcohol climbs — “thicker” and “weaker” were
              always the same fault.{" "}
              <span className="font-semibold">Two non-negotiables:</span> the
              enzyme makes sugar, not alcohol, so you must re-pitch yeast
              alongside it; and glucoamylase’s 55–60 °C peak would kill that
              yeast, so you run a compromise temperature.
            </p>

            <ol className="mt-6 space-y-4">
              {[
                [
                  "Dose the enzyme",
                  "Stir glucoamylase (당화효소) into the mash at ~1–2 g per kg of rice — roughly 1 tsp for a 3 kg batch, though retail powders vary by 역가 (activity), so follow the label. You can’t really under-shoot; if it hasn’t thinned in 24 h, add more. Your tangy mash is already at the enzyme’s ideal pH 4.0–4.5.",
                ],
                [
                  "Re-pitch + hold 28–32 °C",
                  "Add a few grams of rehydrated EC-1118 or sake yeast. Hold 28–32 °C — warm enough for the enzyme, squarely in the yeast’s band. Stir daily the first 2–3 days.",
                ],
                [
                  "Ferment to true completion",
                  "Wait for all three: 단맛 gone, 기포 stopped, the top clears. The visible thinning is your proof. Then cold-settle at 0–4 °C and draw the clear 청주 off the top.",
                ],
              ].map(([h, b], i) => (
                <li key={i} className="flex gap-4">
                  <span className="amt mt-0.5 text-2xl text-[var(--vermilion)]">
                    {i + 1}
                  </span>
                  <div>
                    <h4 className="font-semibold">{h}</h4>
                    <p className="text-[0.95rem] text-[var(--ink-soft)]">{b}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <aside className="card h-fit rounded-lg p-6 sm:p-7">
            <h3 className="kr text-sm tracky text-[var(--ink-faint)]">
              당화효소 — quick reference
            </h3>
            <dl className="mt-4 space-y-3.5 text-[0.95rem]">
              {[
                ["Dose", "≈ 1–2 g / kg rice (product — varies by 역가)"],
                ["Enzyme peak", "55–60 °C — but kills yeast"],
                ["Rescue temp", "28–32 °C (enzyme + yeast both work)"],
                ["Ideal pH", "4.0–4.5 — a tangy mash is already there"],
                ["Yeast", "EC-1118 / sake, tolerant to ~18%"],
                ["Over-dose", "thin but bone-dry & hollow — don’t dump"],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex justify-between gap-4 border-b border-[var(--line-soft)] pb-3"
                >
                  <dt className="shrink-0 font-semibold">{k}</dt>
                  <dd className="text-right text-[var(--ink-soft)]">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 text-[0.82rem] italic leading-relaxed text-[var(--ink-faint)]">
              Don’t add water to thin it — that only weakens an already-weak
              wine. If you must add liquid, use 청주 or a splash of neutral
              spirit, not water.
            </p>
          </aside>
        </div>
      </section>

      {/* ============ SOURCES / FOOTER ============ */}
      <footer className="border-t-2 border-[var(--ink)]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <SectionHead
            n="—"
            ko="출처"
            title="Sources"
            sub="Korean texts behind the recipes"
          />
          <div className="mt-8 grid gap-x-10 gap-y-3 text-[0.9rem] text-[var(--ink-soft)] sm:grid-cols-2">
            {[
              ["한국전통주연구소 · 박록담 고조리서 DB", "koreansool.kr"],
              ["한국민족문화대백과 — 삼해주 · 석탄주", "encykorea.aks.ac.kr"],
              ["술독 — 양조 원리 · 오양주", "suldoc.com"],
              ["임원경제지 · 산가요록 · 음식디미방 · 양주방", "고문헌"],
              ["농민신문 — 석탄주 · 누룩 법제", "nongmin.com"],
              ["오양주 복원 특허 KR2014/2015", "patents.google.com"],
              ["한국술 기행 — 삼해소주 108일", "koreancenter.or.kr"],
              ["Brewing Forward / Label Peelers — glucoamylase", "homebrew"],
            ].map(([t, s]) => (
              <div
                key={t}
                className="flex items-baseline justify-between gap-4 border-b border-[var(--line-soft)] py-2.5"
              >
                <span className="kr">{t}</span>
                <span className="shrink-0 text-[0.78rem] tracky text-[var(--ink-faint)]">
                  {s}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-10 max-w-3xl text-[0.86rem] leading-relaxed text-[var(--ink-faint)]">
            Honest caveats: no single canonical 오양주 survives in the old texts —
            it is reconstructed from documented patents (홍국 오양주; the
            commercial 천비향) and 삼양주 craft. 삼해주 is among the most-documented
            wines in the canon, recorded across many of the old texts; old 말/되
            don’t map cleanly to modern metric,
            so the scaler holds within-recipe ratios rather than literal
            historical volumes. Brew to your own taste and local law.
          </p>

          <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-[var(--line)] pt-6 sm:flex-row sm:items-center">
            <span className="kr text-2xl font-bold">양조</span>
            <span className="kr text-[0.74rem] tracky text-[var(--ink-faint)]">
              brewing.dante4000.com · 술이 익으면 버들개지 필 무렵
            </span>
          </div>
        </div>
      </footer>
    </main>
    </BrewProvider>
  );
}

/* ---------- helpers ---------- */

function accentHex(a: "vermilion" | "indigo" | "ochre"): string {
  return a === "vermilion"
    ? "var(--vermilion)"
    : a === "indigo"
      ? "var(--indigo)"
      : "var(--ochre)";
}

function SectionHead({
  n,
  ko,
  title,
  sub,
}: {
  n: string;
  ko: string;
  title: string;
  sub: string;
}) {
  return (
    <div className="flex items-end gap-5">
      <span className="seal kr h-12 w-12 shrink-0 text-xl">{ko}</span>
      <div>
        <div className="flex items-center gap-3">
          <span className="text-[0.72rem] tracky text-[var(--ink-faint)]">
            {n}
          </span>
          <span className="eyebrow">{sub}</span>
        </div>
        <h2 className="display text-[clamp(2rem,5vw,3.4rem)] font-bold leading-tight">
          {title}
        </h2>
      </div>
    </div>
  );
}

function Spec({ k, v, wide }: { k: string; v: string; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <dt className="text-[0.64rem] tracky text-[var(--ink-faint)]">{k}</dt>
      <dd className="kr mt-0.5 leading-snug">{v}</dd>
    </div>
  );
}

function ProseHead({ ko, title }: { ko: string; title: string }) {
  return (
    <div className="flex items-baseline gap-2.5">
      <span className="kr text-sm" style={{ color: "var(--vermilion)" }}>
        {ko}
      </span>
      <h3 className="text-[0.72rem] tracky text-[var(--ink-faint)]">{title}</h3>
    </div>
  );
}

function Prose({
  ko,
  title,
  children,
}: {
  ko: string;
  title: string;
  children: string[];
}) {
  return (
    <div>
      <ProseHead ko={ko} title={title} />
      <div className="mt-3 space-y-3 text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">
        {children.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </div>
  );
}
