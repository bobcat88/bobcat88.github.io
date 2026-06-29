---
type: baseline
project: phoenix
phase: 0
status: active
date_maj: 2026-06-28
tags: [project/phoenix, career-os, baseline]
---

# Phase 0 — Baseline & Centralization

> `bobcat88.github.io` is now the **single source of truth (SSOT)** for everything career. All CV content, mission data, skills/achievements libraries, and the CV Factory live here. Live site is one *output* of this repo, not the repo's purpose.

## Why centralize here

- Already a git repo + GitHub Pages (versioned, deployable, public surface).
- Already symlinked from the Borg vault (`300 Entities/Career/online-cv` → this repo), so the knowledge graph stays connected.
- One place to maintain → easier upgrade, easier optimize, faster custom CV per offer.

## Asset inventory (current state)

### Content sources (overlapping — to consolidate into `library/`)
| Source | Items | Quality | Action |
|--------|-------|---------|--------|
| `CV/*.docx` (parent dir) | 12 (CV NORGAY, Dossier compétences, Skills Portfolio, 9 expériences) | raw, ~320–1490 words each | extract content → condense, then **retire docx** |
| Vault `Career/Missions/*.md` | 10 missions + `00-Dossier-de-competences.md` | already condensed, structured | **primary import** |
| Vault `Career/Johan - Working Profile.md` | identity/profile (9.2K) | structured | → `library/profile.md` |
| Vault `Career/Career - MOC.md` + `Online CV.md` | maps of content | index | reference |
| Google Drive | `Proust - CV`, `01- Resume Proust`, `CV_Chef_de_projet_senior-0526.pdf`, `Dossier Compétence`, `Cv/` folder | mixed FR/EN, PDFs | catalog, pull on demand |
| This repo `index.html` (93K) | live site | Niveau 4 | refactor in place (Phase 4) |

### Mission set (10)
Arkéa (Banque de détail) · Neosoft · Thales · EPSI · Gestion Locative · Shuhan Plastics (Chine) · Vacorda · Diadom · Justrade · (+ Velocity Lab / entrepreneurial).

## Current-state metrics — ⏸️ PARKED (2026-06-29)

> Not relevant right now: Johan was on a 6-month mission, so there is no recent application activity to baseline. Revisit when actively prospecting. Table kept below for when it matters.

### (parked) ⚠️ TO FILL (needed to prove lift)

Cannot prove improvement without these. Johan to provide best estimate of the last ~3 months:

| Metric | Current value | Source/notes |
|--------|---------------|--------------|
| Applications sent / month | _TBD_ | |
| Recruiter response rate | _TBD %_ | responses ÷ applications |
| Response → interview rate | _TBD %_ | |
| Interview → offer rate | _TBD %_ | |
| Qualified opportunities / month | _TBD_ | |
| Current TJM / target salary | _TBD_ | |
| Time to customize 1 CV today | _TBD min_ | factory target: < 30 min |

## Output format — A4 HTML → print-to-PDF (no more docx)

CVs are **A4-formatted HTML** rendered from the content library by scripts, styled once with print CSS, and exported to PDF for "paper" or download.

- **Format**: single HTML per CV, A4 via CSS `@page { size: A4; margin: … }` + `@media print`.
- **Data-driven**: content stays in `library/` (markdown/JSON). A render script injects it into a template → finished HTML. Change a fact once in the library → every CV re-renders.
- **PDF export**: browser Print-to-PDF (zero-dep, pixel-accurate) or headless via Playwright (already in stack) / `weasyprint` for batch. No docx, no Word.
- **Styling SSOT**: one print stylesheet (`factory/styles/print-a4.css`) shared by all variants → consistent typography across ATS/Premium.
- **ATS caveat**: some ATS parse PDF poorly. Keep ATS variant as **clean single-column, selectable-text** HTML→PDF (no multi-column, no text-in-images), so parsers extract correctly.

## Proposed repo architecture (CV Factory hub)

```
bobcat88.github.io/
├── index.html              # Niveau 4 — live site (one output)
├── PROJECT-PHOENIX.md      # plan (copied from parent)
├── BASELINE.md             # this file
│
├── library/                # ← SINGLE SOURCE OF TRUTH (all content, md/json)
│   ├── profile.json        # identity, contact, positioning, tagline, 2-layer titles
│   ├── skills.md           # WP03 — skill → proof → mission → result → use-case (50+)
│   ├── achievements.md     # WP04 — reusable wins (CV/portfolio/interview/case)
│   ├── missions/           # one .md per mission (imported from vault Career/Missions)
│   └── case-studies/       # WP06 — 3 flagship (8-section) + 7 lite
│
├── cv/                     # generated A4 HTML CVs (+ exported PDFs)
│   ├── ats/                # ATS variant per offer  (single-col, selectable text)
│   └── premium/            # narrative variant
│
└── factory/                # CV Factory (WP05)
    ├── README.md           # how to run: offer in → A4 HTML + PDF out
    ├── render.{js|py}      # library + template → A4 HTML; --pdf for export
    ├── templates/          # A4 HTML templates: cv-ats, cv-premium, lm, pitch
    ├── styles/print-a4.css # shared A4 print stylesheet (styling SSOT)
    ├── offers/             # incoming job descriptions (input)
    └── outputs/            # per-offer bundle: CV(html+pdf) + LM + pitch + gap
```

### Flow
```
job offer  →  factory/offers/<offer>.md
                     │
                     ▼   render.js pulls library/: profile + matching skills + achievements + missions
            factory/outputs/<offer>/  →  cv.html (A4)  →  cv.pdf  + LM + pitch + gap analysis
```

## Phase 0 deliverables

- [x] Inventory all sources (this doc)
- [x] SSOT decision = this repo
- [x] Capture baseline metrics (needs Johan's numbers)
- [x] Scaffold `library/` + `factory/` + `cv/` structure
- [x] Import vault missions → `library/missions/`
- [x] Condense 12 docx → `library/` (skills, achievements, profile)

## Open decisions (need Johan)

1. **Baseline numbers** — fill the metrics table (even rough estimates).
2. **Migration vs reference** — copy vault mission `.md` into `library/missions/`, or keep vault as source and symlink? (Recommend: copy into repo = SSOT; vault keeps knowledge-graph notes that *link* to repo.)
3. **Drive** — pull the Drive PDFs/CVs into the repo as reference, or leave in Drive and just catalog?

> **Scope note (2026-06-29)** : per-platform CV tailoring **retiré du projet** (peu réaliste sans logique de tailoring réelle). Plus de `cv/platforms/`, plus de `platforms.md`, plus de flag `--platform`. LinkedIn reste une cible mais via le positionnement de `library/profile.json`, pas un CV généré.

## Content SSOT — resolution (2026-06-28)

- **`library/experience.json` = the render SSOT** for CV experience (consumed by `factory/render.js`). It now carries, per mission: `role, company, period, location, context, stack[], bullets[]`.
- **`library/missions/*.md` = human reference / narrative** (full mission write-ups, vault-linked). Not read by the renderer. When a fact changes, edit `experience.json` (and optionally mirror the prose in the mission `.md`).
- **`library/case-studies.json` = SSOT des popups étude de cas du site** (bilingue FR/EN, structuré : kicker, role, context, problem, approach, results, stack, accent, doc). Édite ce fichier puis lance **`bun factory/build-site.js`** → génère `case-studies.js` (racine, `window.CASE_STUDIES`) que charge `index.html`. **Ne pas éditer `case-studies.js` à la main** (généré).
- **`library/case-studies/*.md` = narratif humain longform** (Contexte/Problème/Résultats + tags), référence/brouillon pour le dossier de compétences. Plus consommé par le site (remplacé par `case-studies.json`). 11 vs 9 expériences salariées : velocity / luz-saisonnier / trading-perso sont entrepreneuriaux/perso et n'ont volontairement pas d'entrée `experience.json`.
- **Two premium templates** (resolved): `designs/cv-a.html` = **Dossier générique** (ESN / portage, ≤3 A4, all 9 experiences) ; `designs/cv-b.html` = **CV ciblé** (offer-tailored, 1 A4). See `factory/README.md`.
