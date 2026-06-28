# CV Factory — Project Phoenix

Turn one content library into any career deliverable. Edit content **once** in `../library/`; every output re-renders.

## Chosen design — **B · Plum Sidebar** (deep aubergine)
Master files (edit these, they're the canonical CVs):
- `designs/cv-b.html` — **premium CV** (dark-aubergine sidebar + light main, fits 1 A4).
- `designs/cv-ats.html` — **ATS CV** (single-column, selectable text, parser-safe, 1 A4).
- `designs/data.js` — content for both (mirrors `../library/`; v1 render.js will generate it).
- `designs/base.css` — A4 page shell + print rules. Palette lives per-file (`:root`).
- `templates/lettre.html` — cover letter (fills `{{OFFER_*}}` slots).
- `templates/pitch.html` — Niveau 1 elevator one-pager.

Palette: accent `#6e2b74`, sidebar `#34123a→#4c1d54`. Change in each file's `:root`.

Other archetypes kept for reference: `designs/gallery2.html` (A,C,D,E,F).

## Pieces
- `../library/` — SSOT content (profile.json, skills.md, achievements.md, missions/, case-studies/).
- `offers/` — incoming job descriptions (input).
- `outputs/` — per-offer bundle: CV + LM + pitch + gap analysis.
- `render.js` — render engine (Bun) — v1 TODO: emit cv-b/cv-ats from `library/` + offer.

## Usage (Bun)
```bash
bun factory/render.js --variant ats                 # generic ATS CV → cv/ats/
bun factory/render.js --variant premium             # narrative CV  → cv/premium/
bun factory/render.js --variant ats --offer factory/offers/acme.md   # tailored → outputs/acme/
bun factory/render.js --variant ats --pdf           # also export A4 PDF
bun factory/render.js --variant ats --platform malt # platform variant → cv/platforms/
```

## Output format
A4 HTML → print-to-PDF (browser Ctrl-P, or Playwright headless via `--pdf`). No docx.
ATS variant stays single-column / selectable-text so parsers extract cleanly.

## Pick a design
Open `designs/gallery.html` → preview 10 light premium themes with real data → note the chosen `theme-NN` → set it as the default in `styles/print-a4.css`.

## Roadmap
- v0 (now): profile.json injection, ATS template, design gallery.
- v1: iterate `library/missions/*.md` into experience section; offer-keyword skill filtering.
- v2: LM + pitch + gap-analysis bundle generation per offer.
