"use client";

import { useEffect, useState } from "react";

/**
 * Sticky header with scroll-spy: the link for the section currently in view
 * gets an underline. Recipe sections all map to the single "Recipes" link.
 */
export default function SiteNav({ recipeIds }: { recipeIds: string[] }) {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const ids = ["ranking", "principles", ...recipeIds, "rescue"];
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (!els.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          );
        if (visible[0]) {
          const id = visible[0].target.id;
          setActive(recipeIds.includes(id) ? "recipes" : id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [recipeIds]);

  const links = [
    { key: "ranking", href: "#ranking", label: "Ranking" },
    { key: "principles", href: "#principles", label: "Principles" },
    { key: "recipes", href: `#${recipeIds[0] ?? "top"}`, label: "Recipes" },
    { key: "rescue", href: "#rescue", label: "Rescue" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--paper)]/85 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-8">
        <a href="#top" className="flex items-baseline gap-2">
          <span className="kr text-xl font-bold">양조</span>
          <span className="hidden text-[0.7rem] tracky text-[var(--ink-faint)] sm:inline">
            a brewing journal
          </span>
        </a>
        <nav className="flex items-center gap-5 text-[0.72rem] tracky sm:gap-7">
          {links.map((l) => (
            <a
              key={l.key}
              href={l.href}
              className="navlink"
              data-active={active === l.key}
            >
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
