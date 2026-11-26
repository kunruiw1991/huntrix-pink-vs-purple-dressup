# Claude Reproducibility Audit Prompt — **Opus 5.5 (`extra`)**

**Target Auditor Model**: Anthropic **Claude Opus 5.5** (`--model claude-opus-5-5`, reasoning/effort: **`extra`**)
**Reference Video**: `https://youtu.be/znyzrXWXHyE` — *"PINK vs. PURPLE Huntrix Dress-Up | Designing a Dream Dress!"* (*The Crinkly Tingles*)
**Visual Evidence Bundled in Repo**:
- `.qa/comparison_grid.png` (8 side-by-side beats: Original Video LEFT vs. Our Build RIGHT)
- `.qa/reference/thumb_maxres.jpg` and `.qa/reference/sb0_00.jpg`–`sb0_03.jpg` (full original YouTube storyboard sheets)
- `screenshot.jpg` (live showdown stage)

## Audit Scope (Opus 5.5 Extra Deep Review)
1. **Visual Fidelity vs. Original Video (1–10)**: Compare `.qa/comparison_grid.png` and `.qa/reference/*` against `js/art_scenes.js` & `assets/*.png|jpg`. Check split bedroom, `MY DESIGN BOOK`, flower watercolor palette, purple starry cape gown + pearls, Mira's pink ruffled ballgown, white handheld mini fan, `3×3` pink shoes memory board, and concert spotlight showdown.
2. **Streamlined Wordless UI Compliance (`critters-coloring-game` Standard, 1–10)**: Verify instant-play on load (no blocking intro modal), single floating frosted top/bottom pills, pure visual gallery (`▦`), inline `✓/✕` destructive reset confirmation, and zero horizontal overflow on Desktop/iPad/Mobile.
3. **Interactive Gameplay & State Integrity (1–10)**: Audit `js/state.js`, `js/main.js`, `js/audio.js`, and `tests/unit.test.js` for edge cases (touch/iPad Safari gestures, `3×3` memory mismatch timer races, localStorage corruption, audio unlock).
4. **Actionable Findings**: Classify every issue as **P0 / P1 / P2** with exact `file:line` references and concise fix recommendations.
