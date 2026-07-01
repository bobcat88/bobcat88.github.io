---
type: process
project: phoenix
date_maj: 2026-06-28
qloop_threshold: 9.5
---

# CV Factory — Application Process (canonical)

The repeatable pipeline that runs whenever Johan gives an offer. Output is a tailored, QLoop-hardened application bundle in the **private** repo.

## Trigger
Johan provides an offer (URL or pasted text).

## Steps

1. **Capture → local file.** Create `application/<company>/<role-slug>-<posted-date>/offer.md` (private repo, symlinked). Fetch the posting (browser if JS-rendered). Record: company, title, location, contract, clearance, missions, required profil, **fit analysis** (matched proofs from `library/`), **gaps**, **ATS keywords**, angle.

2. **Fetch templates.** `designs/cv-b.html` (premium), `designs/cv-ats.html` (ATS), `templates/lettre.html`, `templates/pitch.html`.

3. **Read profile.** `library/` (`profile.json`, `skills.md`, `achievements.md`, `missions/`) **and the online resume** (`index.html`) — for tone, positioning, the "what drives me" narrative.

4. **Tailor (copywriting).** Build offer-specific content:
   - Reorder/spotlight the experiences + achievements that match the offer.
   - **Experience scoring.** For tailored CVs, rank missions with a weighted model, not chronology alone: offer relevance first (themes, keywords, stack phrases, token overlap), then proof quality (flagship/solid/support), proof weight, scope, duration and recency. A flagship mission can break ties but must not win without a real offer match. Offer-specific overrides may boost known target proofs, but non-preferred missions can still enter if their relevance score is stronger.
   - Inject the offer's exact keywords (ATS) where truthful.
   - Use the exact expected role as the visible title. Example: for "Chef de projet MOA (F/H)", write "Chef de projet MOA", not a broader title such as "Chef de projet senior · PMO · Product Owner".
   - Sharpen summary + value proposition to the offer's core need.
   - Cite up to 3 similar missions when they directly prove the expected role. Keep them factual and short.
   - References on tailored HR CVs stay minimal: name, role, company, contact only. No attestation paragraph, no extra context. ATS keeps the same content in plain text, with no SVG or visual-only element.
   - Rédaction FR: phrases naturelles, pas d'artefacts "AI". Do not use `--` or `---` in body text. Avoid em-dash separators in prose; use a comma, a colon, or a sentence break. Keep hyphens only when they are part of numbers, date ranges, compounds, or technical labels.
   - Human template may use small inline SVGs for key-result cards when they improve scanning. ATS template remains pure selectable text.
   - Rules: **problems before tools · results before missions · value before responsibilities.**
   - **Language = the offer's language.** FR offer → FR. EN offer → EN.
   - **Passion projects.** When `library/profile.json` contains relevant `passionProjects`, select 1-2 highly relevant projects by the same offer-relevance logic: themes, keywords, stack/tags, proof weight and scope. Inject them as proof of curiosity/applied builder behavior. Generic CVs also include 2 default high-scope projects. Do not present them as client missions. For tight ATS exports, keep them compact and remove/reduce references before dropping core experience.

5. **/QLoop — Devil's Advocate to ≥ 9.5/10 on ALL files.** Draft silently → hostile-but-fair review (recruiter + ATS engine + hiring manager) → score → fix → repeat (max 3 loops/file). Score dimensions (every file):
   | # | Dimension | Check |
   |---|-----------|-------|
   | 1 | **ATS parse-ability** | single-column where needed, selectable text, no text-in-image, keywords present |
   | 2 | **Human readability** | scannable in ~6s, clear hierarchy, no wall of text |
   | 3 | **Print fidelity** | 1 page A4, no overflow/clipping, no visual hiccup, color-safe |
   | 4 | **Core-skill match** | covers the offer's required competences with proof |
   | 5 | **Value proposition** | sells a capability, not just history |
   | 6 | **Role specifics** | clearance, mobility, language, seniority fit addressed |
   | 7 | **Authenticity / no AI tells** | NO em-dash "—" (use "|" for separation); natural FR/EN; no boilerplate |
   | 8 | **No horizontal overflow** | zoom-check long lines (emails, URLs) in browser, not just vertical fit; emails are `mailto:` and wrap |
   | 9 | **Passion-project relevance** | 1-2 projects only, directly mapped to offer keywords; no hobby-dump |
   Present only after ≥ 9.5, with a `[QLoop Result]` summary (iterations, initial vs final, biggest flaw caught).
   **Re-run the full visual review after ANY late edit** (e.g. adding a References block) — vertical page-fit alone is not enough.

6. **Photo.** Embed the round tuxedo `johan-proust.webp` (premium CV + lettre + pitch), same clean look as the online resume. **ATS CV = no photo** (parser-safe).

7. **Output + print.** Bundle in the application folder: `cv-premium.html`, `cv-ats.html`, `lettre.html`, `pitch.html`, `gap-analysis.md`. Print each to A4 PDF for submission.

## Notes
- Threshold 9.5 is mission-closure level (see global QLoop protocol — higher domain threshold wins).
- Bundle is **private** (names the company). Never in the public repo. See the Applications privacy rule.
- KPI: time to tailor < 30 min once the library is mature.
- Scoring edge cases to QLoop: broad keywords can over-rank old international missions; flagship status can hide a weak role fit; short but exact missions can be unfairly buried; passion projects can become a hobby dump. Remediation: audit with `CV_DEBUG_SELECTION=1`, compare relevance vs proof score, enrich missing exact keywords for the true matching mission, demote broad keywords, and keep only 1-2 projects with direct offer evidence.
