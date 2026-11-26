# Codex / OpenAI Reproducibility Audit Prompt — **GPT Astra (`medium`)**

**Target Auditor Model**: OpenAI **GPT Astra** (`--model gpt-astra`, reasoning effort: **`medium`**)
**Reference Video**: `https://youtu.be/znyzrXWXHyE` — *"PINK vs. PURPLE Huntrix Dress-Up | Designing a Dream Dress!"* (*The Crinkly Tingles*)
**Visual Evidence Bundled in Repo**:
- `.qa/comparison_grid.png` (8 side-by-side beats: Original Video LEFT vs. Our Build RIGHT)
- `.qa/reference/thumb_maxres.jpg` and `.qa/reference/sb0_00.jpg`–`sb0_03.jpg` (original YouTube storyboard frames)
- `screenshot.jpg`

## Audit Scope (GPT Astra Medium Review)
1. **Chronological & Mechanic Fidelity (1–10)**: Check whether all 12 steps in `js/data.js` & `js/state.js` accurately reproduce the video's Pink vs. Purple Huntrix paper-doll workflow (Bedroom Invite → Purple Mystery Box & Color Wheel → Pen Sketch → Flower Watercolor Palette → Golden Scissors & Pearls → Purple Starry Runway & Heart Makeup → Pink Badge & Wheel → Pink Sketch → Pink Markers + Glitter + White Mini Fan → `3×3` Pink Shoes Memory Match → Pink Runway → Concert Showdown Vote).
2. **Visual & Chroma-Key Quality (1–10)**: Inspect `.qa/comparison_grid.png` for sprite keying quality (green halo check), layout alignment on `MY DESIGN BOOK`, and zero overlapping/ghosting sprites.
3. **Code & Touch/Responsive Robustness (1–10)**: Review `index.html`, `css/style.css`, `js/main.js`, `js/art_scenes.js`, and `tests/e2e_verify.py` for pointer/touch edge cases, canvas coordinate scaling, memory game race conditions, and accessibility.
4. **Actionable Findings**: Report concrete **P0 / P1 / P2** issues with exact file & line numbers.
