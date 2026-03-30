# Quality Assurance Checklist

> **Status: OBSOLETE** — This checklist has been superseded by the audit round process. See `AUDIT-ROUND-1.md` through `AUDIT-ROUND-5.md` for detailed findings and resolutions covering phases 1-6. The final audit score was **9.6/10**. Phases 7-10 (Ch 28-47) have not yet been audited. The checklist template below is retained as a reference for future audit rounds.

Apply BOTH sections to every chapter before marking complete.

## A. Rendering QA

### Chapter [XX]: [TITLE]
- [ ] Correct heading: `<h2><span class="ch-label">Chapter XX</span>Title</h2>`
- [ ] Section has `id="chXX"` and `data-ch="XX"`
- [ ] Content matches build instructions spec
- [ ] No placeholder text (search: TODO, FIXME, [PLACEHOLDER])
- [ ] "Try This Now" present, `.callout.ok`, copy-paste ready, has verification, has troubleshooting
- [ ] All specified diagrams present
- [ ] SVG viewBox `0 0 700 [height]`
- [ ] Design system classes used (node-fill, node-accent, label-text, sub-text, arrow)
- [ ] Renders in dark theme
- [ ] Renders in light theme
- [ ] Diagram captions state the main takeaway (not just describe the diagram)
- [ ] Callouts use correct variant (warn, info, critical, ok)
- [ ] Tables have `<th>` headers
- [ ] Readable at 700px viewport
- [ ] No horizontal scroll on mobile

## B. Pedagogical QA

### Chapter [XX]: [TITLE]
- [ ] Jargon audit: every technical term defined on first use or in preceding chapter
- [ ] No term used more than 2 paragraphs before definition
- [ ] Maximum 5 new technical terms in this chapter
- [ ] No forward references (no concept used before introduced in curriculum)
- [ ] If forward ref unavoidable: flagged as "We'll cover this in Chapter XX — for now, just know..."
- [ ] Exercise requires ONLY skills from this chapter and preceding chapters
- [ ] Synthesis exercise preceded by at least 2 single-concept micro-exercises
- [ ] Exercise includes verification method (pass/fail, not subjective)
- [ ] Exercise includes troubleshooting (2-3 common failures and fixes)
- [ ] No more than 3 major new concepts introduced
- [ ] Each major concept has its own section with example before next concept
- [ ] 1-3 most common beginner misconceptions identified and addressed
- [ ] LLM ambiguity check: could this spec be interpreted 2+ ways?
- [ ] Diagram spec has enough detail to build (nodes, labels, connections, layout)
