---
type: registry
project: phoenix
date_maj: 2026-06-28
---

# Job Platform Registry

> Which CV variant each platform uses + profile URL. Generic platform CVs live in `cv/platforms/`. Factory: `bun factory/render.js --variant ats --platform <slug>`.

| Platform | Slug | Profile / status | CV variant | Notes |
|----------|------|------------------|------------|-------|
| LinkedIn | linkedin | linkedin.com/in/johan-proust | Premium + headline | Headline = title + capability (2-layer) |
| Malt | malt | _TBD_ | ATS-premium | Freelance, TJM 465 €/j |
| Free-Work | free-work | _TBD_ | ATS | Freelance/CDI tech |
| Comet | comet | _TBD_ | Premium | Curated freelance |
| APEC | apec | _TBD_ | ATS | Cadres CDI |
| Welcome to the Jungle | wttj | _TBD_ | Premium | Culture-fit emphasis |
| Indeed | indeed | _TBD_ | ATS | High-volume, keyword-heavy |
| France Travail | france-travail | _TBD_ | ATS | — |

## Per-platform rules
- **ATS-heavy (Indeed, APEC, France Travail)**: single-column, max keywords, no graphics.
- **Curated/premium (Comet, WTTJ, Malt)**: narrative + results-first, premium design ok.
- **LinkedIn**: not a CV — headline + about reuse `library/profile.json` positioning.

_TBD = catalog exact profile URLs (some referenced in vault — to confirm)._
