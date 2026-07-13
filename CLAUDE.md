<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **bobcat88.github.io** (505 symbols, 606 relationships, 10 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "main"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({search_query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/bobcat88.github.io/context` | Codebase overview, check index freshness |
| `gitnexus://repo/bobcat88.github.io/clusters` | All functional areas |
| `gitnexus://repo/bobcat88.github.io/processes` | All execution flows |
| `gitnexus://repo/bobcat88.github.io/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

# CLAUDE.md — johanproust.me (Project Phoenix site)

Up: [[AI Agents Vault]] · Rules: [[Stack Contract]] · [[AI Collaboration Protocol]] · [[AI Coding Rules]]

#ai-agents #claude-code #borg #project/phoenix #stack-core

## Project Context

This repo is the **live site** of Johan Proust (GitHub Pages → johanproust.me), Niveau 4 of **Project Phoenix** — the professional-identity ecosystem. Parent docs root: `../` (CV ATS, CV Premium, dossier de compétences, portfolio). Project skill + full Phoenix context: `../CLAUDE.md`.

Positioning the site must express: *"J'aide les organisations à reprendre le contrôle de systèmes complexes."* Answer Qui suis-je / Comment je réfléchis / Pourquoi ça fonctionne / Pourquoi différent / Quels problèmes je résous. Sell a capability, not a job title.

## Read (shared vault — no local copies)

- `AI-Agents/_shared/AI Coding Rules.md`
- `AI-Agents/_shared/stack-contract.md`
- `AI-Agents/_shared/mcp-registry.md`
- `AI-Agents/_shared/hook-registry.md`
- `300 Entities/Projects/Portfolio - Condensed Knowledge.md`
- `400 Resources/Tech/Mandatory AI Development Stack.md`

Vault root: `/home/_johan/Documents/Borg/`. Shared fallback: `/home/_johan/Documents/Borg/AI-Agents/_shared/`.

## MCP Rules

- Core MCPs: Memory, Context7, GitNexus (this repo is indexed — see block above).
- Enable Playwright for UI/visual verification of the site.
- Use fully qualified MCP tool names in durable docs/skills. Keep secrets out of MCP config.
- GitNexus discipline (above) is mandatory: `impact` before symbol edits, `detect_changes` before commits, honor HIGH/CRITICAL warnings.

Use Beads, GitNexus, RTK, Caveman Full, GSD Core where supported. Durable facts → Borg vault, not chat.

## AI Coding Rules

Follow [AI Coding Rules](file:///home/_johan/Documents/Borg/AI-Agents/_shared/AI%20Coding%20Rules.md): SOLID/SRP, DDD, DRY, KISS, SOTA. Read surrounding code first, small explicit changes, verify before claiming done. `index.html` is large — edit precisely, don't rewrite wholesale.

> [!IMPORTANT]
> Before any UI/frontend change, read `/home/_johan/Documents/Borg/400 Resources/Tech/UI/UI UX Best Practices.md` and invoke the `ui-design-rules` skill (mandatory per global rules).

## Quality Loop

On `/QLoop`, an iterative quality loop request, or "improve until target score": follow the [Quality Loop Protocol](file:///home/_johan/Documents/Borg/AI-Agents/_shared/qloop-protocol.md). Silent draft → Devil's Advocate → score → refine until ≥ 9.0/10 (max 3 iters) → present with `[QLoop Result]` summary. Higher domain threshold wins.

## Mission Closure

On mission closure / RETEX / sponsor report / handoff / gains-ROI / closing audit: follow the [Mission Closure RETEX Protocol](file:///home/_johan/Documents/Borg/AI-Agents/_shared/mission-closure-retex-protocol.md). Do not close until mini score ≥ 9.5/10 or blocker is explicit.

## Phoenix Principles (positioning hygiene)

Every section of the site obeys: problems **before** tools · results **before** missions · value **before** responsibilities. Keep the site aligned with the other five Phoenix levels.

## Applications privacy rule (MANDATORY)

Tailored job applications **NEVER** live in this public repo. This repo is served via GitHub Pages — anything here is world-readable. Per-company applications go in the **PRIVATE** companion repo `career-applications` (`github.com/bobcat88/career-applications`), surfaced here through a **gitignored symlink** `application/`.

- **Public** (`bobcat88.github.io`): factory, `library/`, master CV designs. Generic, shareable.
- **Private** (`career-applications`): per-company `offer.md`, tailored CVs (premium + ATS), lettres, pitches, gap analyses, source captures. **Anything naming a target company or tailored to a specific offer.**

**Référents.** Referent cards are HR-facing and private-only. `factory/render.js` (`parseReferents`) reads a `## Référents` section from the **private `offer.md`** and injects a "Références" block into the tailored `cv-premium`/`cv-ats` **only when `--offer` is passed**. Generic/public runs carry none — privacy by construction. **Never** put referent names/contacts in the public `library/`. Source of truth for referent identities: vault `Borg/300 Entities/People/`. See `[[Velocity Lab]]`.

Never commit `application/` to this repo. `.gitignore` contains a **bare** `application` line — it must stay bare: `application/` (trailing slash) only matches a real directory and would **fail to ignore the symlink**, leaking private data.

### Recreate the symlink (if missing)
```bash
cd bobcat88.github.io
ln -s ../career-applications application     # repos are siblings under Projects/CV/
git check-ignore application                 # must print: application
git status --porcelain | grep application    # must print nothing (ignored)
```

### Fresh clone / new machine
```bash
git clone https://github.com/bobcat88/bobcat88.github.io.git
git clone https://github.com/bobcat88/career-applications.git   # private
cd bobcat88.github.io && ln -s ../career-applications application
```
The symlink target is **relative** (`../career-applications`) so both repos move together safely. Mirror of this rule lives in `career-applications/CLAUDE.md`.


<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:7510c1e2 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->
