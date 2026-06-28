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
   - Inject the offer's exact keywords (ATS) where truthful.
   - Align the title line to the offer (2-layer: real searchable title + capability).
   - Sharpen summary + value proposition to the offer's core need.
   - Rules: **problems before tools · results before missions · value before responsibilities.**
   - **Language = the offer's language.** FR offer → FR. EN offer → EN.

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
   Present only after ≥ 9.5, with a `[QLoop Result]` summary (iterations, initial vs final, biggest flaw caught).
   **Re-run the full visual review after ANY late edit** (e.g. adding a References block) — vertical page-fit alone is not enough.

6. **Photo.** Embed the round tuxedo `johan-proust.webp` (premium CV + lettre + pitch), same clean look as the online resume. **ATS CV = no photo** (parser-safe).

7. **Output + print.** Bundle in the application folder: `cv-premium.html`, `cv-ats.html`, `lettre.html`, `pitch.html`, `gap-analysis.md`. Print each to A4 PDF for submission.

## Notes
- Threshold 9.5 is mission-closure level (see global QLoop protocol — higher domain threshold wins).
- Bundle is **private** (names the company). Never in the public repo. See the Applications privacy rule.
- KPI: time to tailor < 30 min once the library is mature.
