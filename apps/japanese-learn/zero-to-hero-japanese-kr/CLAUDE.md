# Japanese Zero-to-Hero Build

## Project Overview
18-chapter interactive HTML reference. One HTML file per chapter. Survival-first order: scripts > daily use > grammar > depth. Interactive TOC with completion checkboxes and progress bar.

## Build Rules
1. NEVER modify reference/fuso-hmi-reference.html
2. Build ONE chapter at a time, in order
3. Every chapter MUST include: >=3 quiz widgets, >=1 mnemonic SVG, >=1 Recall Check (after Ch01), exercises at 3 difficulty tiers, "Mark as Complete" button
4. Update PROGRESS.md after each chapter

## Pedagogical Non-Negotiables
- NO concept without a concrete example
- NO character without a visual mnemonic
- NO grammar rule without a Korean parallel AND interactive exercise
- NO chapter ends without retrieval practice quiz
- NO chapter (after Ch01) starts without Recall Check
- Every comparison table followed by elaborative interrogation prompt

## Font: Noto Sans JP + Noto Sans KR. <meta charset="UTF-8">. Verify CJK rendering.

## File Structure
- src/index.html - Landing page with hero + chapter checklist + progress bar
- src/ch-XX.html - Individual chapter files
- src/css/design-system.css - All CSS
- src/js/shared.js - window.storage API, chapter progress helpers
- src/js/theme.js - Dark/light theme toggle
- src/js/sidebar.js - Navigation, checkboxes, progress bar updates
- src/js/quiz-engine.js - All 7 quiz types (Flashcard, DragMatch, FillBlank, TimedSprint, SentenceBuilder, AudioDiscrimination, RecallCheck) + MultipleChoice
