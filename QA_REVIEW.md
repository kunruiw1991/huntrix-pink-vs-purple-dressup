# Reproducibility & Quality Audit Request — PINK vs. PURPLE Huntrix Dress-Up Studio

- **Reference Video**: https://youtu.be/znyzrXWXHyE (*PINK vs. PURPLE Huntrix Dress-Up | Designing a Dream Dress!*, The Crinkly Tingles)
- **Live Playable Build**: https://kunruiw1991.github.io/huntrix-pink-vs-purple-dressup/
- **Visual Side-by-Side Comparison Grid**: `.qa/comparison_grid.png`
- **Original Reference Storyboards**: `.qa/reference/thumb_maxres.jpg`, `.qa/reference/sb0_00.jpg`–`sb0_03.jpg`
- **Automated Verification**:
  - `node --test --experimental-test-coverage tests/unit.test.js`: 4/4 suites passed (96.49% overall line coverage, 100% functions)
  - `python3 tests/e2e_verify.py`: 0 console/page errors, 0 horizontal overflow across `1280×800`, `1024×768`, `768×1024`, and `390×844`

## Mandated External Auditors (User Game Design Rule)
1. **Claude Opus 5.5 (`extra`)** — via `@claude` (`.qa/claude_prompt.md`, `.github/workflows/claude.yml`)
2. **OpenAI GPT Astra (`medium`)** — via `@codex review` (`.qa/gpt_prompt.md`)
