---
type: audit
project: phoenix
phase: 0
scope: system-coherence
status: findings
date: 2026-06-28
---

# CV Factory — System Coherence Audit

Cross-check of the built system: `library/` (SSOT) ↔ `factory/render.js` ↔ `factory/designs/` ↔ `cv/` outputs ↔ docs (`BASELINE.md`, `factory/README.md`, `factory/PROCESS.md`). Read-only audit; no source changed. Findings ordered by severity with fix.

## Summary

System renders (`bun factory/render.js --variant ats|premium` works). Library SSOT is complete and schema-consistent with `render.js`. The defects are **coherence drifts** between code, docs, and committed artifacts — not render-blocking, but they silently produce wrong/inconsistent output, especially for the **tailored (offer) path**, which is never exercised by the smoke test.

| # | Severity | Area | One-line |
|---|----------|------|----------|
| 1 | HIGH | render | Tailored-CV photo path points at nonexistent `_assets/` → broken image on every offer bundle |
| 2 | HIGH | print | `@page` margin conflict; staged print-fix only patches cv-a → margins differ per variant |
| 3 | MED | design | README/PROCESS declare cv-b the master, but render uses cv-a for generic premium → two premium masters |
| 4 | MED | SSOT | Dual source of truth for experience: render reads `experience.json`, docs name `missions/*.md` SSOT |
| 5 | MED | artifacts | `designs/data.js` is a stale committed snapshot; already drifted from `profile.json` |
| 6 | LOW | docs | README points to `designs/gallery.html` — file is `gallery2.html` (broken ref) |
| 7 | LOW | code | Hardcoded `facts[]` + `title` fallback duplicate profile data instead of deriving |
| 8 | LOW | code | Dead helper `base()` in render.js (unused) |
| 9 | LOW | content | case-studies set (11) ≠ experience set (9): velocity/luz/trading have no experience entry |

---

## HIGH

### 1. Tailored-CV photo path broken
`render.js:224`
```js
photo: args.offer ? "../../_assets/johan-proust.webp" : "../../johan-proust.webp",
```
- No `_assets/` directory exists anywhere. Asset lives at repo root `johan-proust.webp`.
- Generic path `../../johan-proust.webp` resolves correctly (`cv/premium/` → root). Tailored output dir is `application/<co>/<role>/`, so `../../_assets/...` → `application/_assets/...` → **404**. Every offer bundle ships with a broken portrait.
- **Fix:** point both at the real asset, or copy the webp into the output dir at render time and reference it locally (matches the self-contained base.css/data.js pattern render already uses).

### 2. `@page` margin conflict — print-fix is half-applied
- `designs/base.css:6` → `@page { size: A4; margin: 0; }`
- Staged (uncommitted) edit added inline `@page { size: A4; margin: 14mm 0; }` to **cv-a.html** and the generated **cv/premium/cv-premium.html** only.
- Cascade: inline `<style>` follows the `base.css` link, so cv-a prints at 14mm; **cv-b, cv-ats, cv-c–f have no inline rule → still margin 0.** Result: generic premium prints with 14mm side/top margins, ATS and tailored premium print edge-to-edge. Inconsistent print fidelity across the exact variants PROCESS step 5 demands be A4-perfect.
- **Fix:** put the canonical `@page` in `base.css` once (single styling SSOT, as BASELINE §"Styling SSOT" intends), drop the per-file inline copies. Then re-render and visually print-check ats + premium + a tailored bundle.

---

## MEDIUM

### 3. Premium master is ambiguous (cv-a vs cv-b)
`render.js:94-96`
```js
const tplFile = m.variant === "premium"
  ? (args.offer ? "factory/designs/cv-b.html" : "factory/designs/cv-a.html")
  : `factory/designs/cv-${m.variant}.html`;
```
- README §"Chosen design" and PROCESS step 2 both name **cv-b** the canonical premium CV. Code uses **cv-a** for generic premium and cv-b only when an offer is present.
- Two premium templates now drift independently (the staged print-fix touched cv-a but not cv-b — already happening).
- **Decide one:** either cv-b is master for both paths (delete/retire cv-a), or document that cv-a = generic Dossier, cv-b = tailored CV and keep both deliberately. Right now code and docs disagree silently.

### 4. Dual source of truth for experience
- `render.js` reads `library/experience.json` for all experience bullets.
- BASELINE §architecture + the imported `library/missions/*.md` (9 files) present `missions/` as the experience SSOT.
- Editing a mission `.md` does **not** change any rendered CV. Two stores of the same facts → guaranteed drift.
- **Fix:** pick one. Either generate `experience.json` from `missions/*.md` (missions = SSOT, json = build artifact, gitignore or regenerate), or declare `experience.json` the SSOT and mark `missions/*.md` as human reference only in BASELINE.

### 5. `designs/data.js` is a stale snapshot — already drifted
- `render.js` generates a fresh `data.js` into each `cv/<variant>/` output. `factory/designs/data.js` is a separately committed static file used when opening `designs/*.html` standalone.
- Confirmed drift: `designs/data.js` title = `"Chef de projet senior · PMO · Product Owner · Business Analyst"` (4 titles). Live `profile.json.identity.titleAts` = 5 entries incl `Program Manager`. The committed snapshot is already wrong.
- **Fix:** make `render.js` (re)write `designs/data.js` from the library too, or gitignore it and document that designs preview against a generated file.

---

## LOW

### 6. README broken reference
`factory/README.md:38` — "Open `designs/gallery.html`". File is `designs/gallery2.html`; no `gallery.html` exists. Update path.

### 7. Hardcoded data duplicates the library
`render.js:245-250` — `facts[]` hardcodes `"13 ans"`, `"7 ans"`, `"> 1 Md€"`; `title` fallback strings are literal. `profile.json` already holds `summary.experienceYears: 13`, `summary.internationalYears`, `titleAts`. Derive from profile so a single edit propagates (the factory's whole premise).

### 8. Dead code
`render.js:271` — `function base(p)` is defined and never called. Remove.

### 9. case-studies (11) ≠ experience (9)
`library/case-studies/` has 11 entries incl `03-flagship-velocity`, `10-lite-luz-saisonnier`, `11-lite-trading-perso`. `experience.json` has 9 (no velocity/luz/trading). Likely intentional (entrepreneurial/personal, not salaried roles) but uncatalogued — a reader of the library can't tell drift from intent. Add a one-line note in BASELINE mapping case-studies → experience coverage.

---

## Phase-0 deliverable gaps (from BASELINE checklist, still open)
- **Baseline metrics** — all `_TBD_`; needs Johan's numbers. Blocks any "prove the lift" claim.
- **`cv/platforms/`** — empty. `--platform` flag is wired in render.js but no platform CV has been generated, and `platforms.md` registry isn't connected to any render call.
- **docx condense** — missions imported; skills/achievements/profile condensation from the 12 `CV/*.docx` not verified against the audit checkbox.

## Resolution log — 2026-06-28

Fixed this pass:
- **#1** photo — render.js now copies `johan-proust.webp` into each output dir and references it locally (generic + tailored).
- **#2** `@page` — canonical multi-page rule lives in `cv-a.html` (`13mm 0`, first page bleeds); generated output no longer carries a conflicting inline copy. (cv-ats / cv-b keep `margin:0` deliberately — ATS single-page + cv-b full-bleed sidebar.)
- **#3** premium master — **resolved as two intentional templates**: cv-a = Dossier générique, cv-b = CV ciblé. Documented in README + BASELINE.
- **#4** experience SSOT — `experience.json` declared render SSOT (+ new `context`/`stack` fields); `missions/*.md` = human reference. Documented in BASELINE.
- **#5** `designs/data.js` — render.js regenerates it from the library on every generic run.
- **#6** README `gallery.html` → `gallery2.html`.
- **#7** hardcoded `facts[]` now derive from `profile.summary` (years). Also fixed `education` `"—"` placeholder → empty (was rendering `——`).
- **#8** dead `base()` helper removed.

Deferred (bigger / needs input):
- **#9** case-studies vs experience mapping — noted in BASELINE, no code change.
- ~~Baseline metrics~~ → **PARKED 2026-06-29** (no recent activity to baseline; Johan on a 6-month mission).
- `cv/platforms/` generation — **deferred**: render `--platform` is filename-only; needs real per-platform tailoring before it's worth generating.
- docx-condense verification.

## Backlog resolution — 2026-06-29
- **Site horizontal overflow at 320px** → fixed (`overflow-x: clip` on root; verified 320/390).
- **Case-study triple-copy drift** → resolved: `library/case-studies.json` is now the bilingual SSOT; `bun factory/build-site.js` generates `case-studies.js`; `index.html` loads it (inline copy removed, −75 lines). `library/case-studies/*.md` demoted to human reference.
- **GitNexus index** → reindexed.
- **EN case-studies** → covered: the EN now lives in `case-studies.json` (no separate `*.md` EN needed).

## v2 Dossier (cv-a) — 2026-06-28
Generic premium rebuilt: multi-page (3 A4, verified via PDF), **bold dates/location**, per-mission **context** line + **tech-stack tags**, all 9 experiences, skills in 3-col + formation in 2-col. Output: `cv/premium/cv-premium.{html,pdf}`.

## Recommended fix order
1. #1 photo path + #2 `@page` consolidation (both touch print output the user will see first).
2. #3 master decision + #5 designs/data.js (resolve template/data drift together).
3. #4 experience SSOT decision (architectural; do once, deliberately).
4. #6–#9 cleanups.
5. Phase-0 gaps (metrics need Johan; platforms + docz are build work).
</content>
</invoke>
