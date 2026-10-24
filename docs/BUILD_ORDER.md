# Build Order — Multi-Roadmap Agent Academy

**Date:** 2026-10-24 · **Status:** CANONICAL execution plan · **Sources:** Claude Opus adversarial review (all load-bearing claims verified against code 2026-10-24), MULTI_ROADMAP_UX_PLAN.md (design), verified live-site audit findings · **Baseline:** PR #15 (`e21c0f3`) — 78 vitest green

**Standing rules for every phase:** no hard-coded counts in copy (compute from data) · every page must render for every live bundle (test-enforced) · the engine never learns roadmap names · legacy links never break (redirect, never pin).

---

## Phase 0 — Stop the bleeding *(~half session, one PR)*

Verified live bugs only. Zero design decisions.

- Landing "Prompt Engineering · 0 phases planned" → derive from bundle (`Landing.tsx:137`)
- Stale counts: "Eight phases, forty-four modules" (`Curriculum.tsx:185`), "All 44 curriculum modules…" (`Review.tsx:244`), "All 44 Modules" (`Roadmap.tsx:77`), "The eight phases" (`Landing.tsx:146`) → compute from data
- /journal horizontal overflow at 375px (form row + inputs, 495px in 360px) → wrap/stack the form header
- Deleting a custom flashcard scores it as correct (`Review.tsx:383`) → drop `finishCard(true)` from the delete path
- `--ink-faint` AA-contrast fail → light `#726c60`, dark `#8f897d` (keeps hue; one token each)
- Add favicon; label the 14 unnamed `role="progressbar"`; More menu closes on outside-click + Escape
- `theme-color` respects dark mode (media query); sitemap drops private pages (/dashboard, /review, /journal, /planner)
- Commit the two uncommitted docs (UX plan + this file)

**Accept:** every count string grep-clean of `44|forty|eight phases`; journal clean at 375; axe contrast pass on `--ink-faint` pages; 78+ tests green.

## Phase 1 — Foundations (R4a-0) *(1–2 sessions)*

The multi-roadmap data model. Nothing in Phase 2 is safe without it.

- Typed `RoadmapBundle` interface in `types.ts` (optional parts defaulted: `LESSONS: Lesson[] = []`); **delete the `as unknown as` cast**; registry test: every bundle satisfies the interface
- Progress schema **v3**: `assessment`, `sequenceMode`, `lastActiveModuleId` → `Record<slug, …>`; `StudySession.roadmap`; existing data migrates under `'ai-agents'`; older builds must not silently drop v3 fields on import
- Card ID namespacing `${slug}/…` with one resolver (legacy unprefixed = `ai-agents`) — kills the future `assess:evals:q0` collision
- Daily plans store `{ slug, moduleId }`, URLs built at render time (stored `/roadmap/${id}` strings are cached and would 404 forever under PE)
- Import hygiene: ban `content/roadmaps/*` imports outside `content/` (ESLint `no-restricted-imports` if ESLint lands, else a fs-scanning guard test)
- Multi-tab safety: `storage` event listener rehydrates state (last-write-wins is silent data loss with two roadmaps open)
- Prune daily plans older than 60 days (localStorage quota headroom)

**Accept:** v2→v3 migration test; render-every-page-for-every-bundle jsdom smoke harness exists and passes; import-ban test fails on a planted violation; 78+ green.

## Phase 2 — Engine (R4a) *(2–3 sessions, store first → routes → pages one by one)*

- Canonical route tree: `/r/:slug/{curriculum,roadmap,roadmap/:moduleId,learn/:lessonId,review,projects,journal,planner,assess}` + `/m/:moduleId` (resolves roadmap from the id — self-healing shared links)
- Legacy paths → `<Navigate replace>` + `vercel.json` 308 redirects (one canonical URL per page; kills duplicate-content and NavLink ambiguity)
- **One rule:** active roadmap = the URL under `/r/`, else `aa-last-roadmap`. No second source of truth
- Migrate all pages/libs off direct ai-agents imports to `useActiveRoadmap()`, each behind a per-bundle render test (store, dailyPlan, recommend, localSearch, CommandPalette, RoadmapGraph included)
- Navbar: hairline divider encoding scope — `● Agent Academy · Today ┊ [Roadmap ▾] Learn · Review · Build · Journal`; `shortTitle` in RoadmapMeta ("Automation"); wordmark collapses to the dot below xl
- Switcher: started roadmaps first (needs `startedAt[slug]` record), then "Start another…"; switching keeps the current section, falls back to Learn if empty
- Mobile: full-width `[Roadmap ▾]` row opening a bottom sheet — not a segmented row (does not fit 4–5 names at 375px)
- More menu split into labeled groups (Global: All roadmaps · Playground · Resources / This roadmap: Map · Assessment) ; Planner split from Settings; "Reset this roadmap" beside "Reset everything"
- Scope the wrongly-global data: Resources keyed `{roadmap, phase}`; glossary cards per-roadmap; ⌘K results grouped by roadmap (focus first) + a search field in the mobile menu (palette is currently unreachable on mobile)

**Accept:** every legacy URL 308s to its canonical form; zero direct bundle imports outside content/; both bundles pass every page's render test; keyboard walk of nav/switcher/palette works.

## Phase 3 — Prompt Engineering goes live, as Beta *(1 session)*

A gate checklist, not a config flip. Beta status = diagnostic + module pages + review deck live; lessons badge only where a lesson exists.

- Flip PE to a new `beta` status (catalog chip "Beta"; switcher lists it) — its diagnostic and 54-card deck already exist as data and currently dead-end behind "Start AI Agents meanwhile"
- Build-time prerendered `<head>` meta for `/roadmaps/:slug` (OG previews are AA-specific today because tags are JS-set) ; `/r/*` marked noindex with canonicals at `/roadmaps/:slug`
- Copy: "Where a lesson exists, it is taught in nine layers"; `/r/prompt-engineering/curriculum` stops 404ing (redirects from Phase 2 anyway)
- First-run fix: "started 0" empty state on Today routes to the catalog instead of a personalized-looking plan; diagnostic CTA above the fold
- Landing/default title de-narrowed (site is no longer only AI Agents): "Agent Academy — structured roadmaps for AI skills" (brand wording: your call)

**Accept:** share preview correct per roadmap; PE diagnostic → credits → seeds its own deck; PE cards appear in Review; no bare 404 on any PE route.

## Phase 4 — Dogfood two weeks *(your work, not building)*

Live with both roadmaps before designing Today v2 from real friction. Keep notes in the Journal: switching annoyance, review load reality, whether you ever want mixed plans. Phase 5 is designed from these notes, not in advance.

## Phase 5 — Today v2: global strip + focused body *(1–2 sessions, after Phase 4 notes)*

- Global strip (the only truly mixed part): streak · minutes today vs budget · total due across decks + "Review all due (N)" · weekly report link
- Focus body: the existing dashboard scoped to one roadmap with an on-page "Focus: [roadmap ▾]" (same state as the navbar switcher); each other started roadmap gets one row (due · next module · last studied → Switch)
- **Delete before adding:** duplicate "cards due" (3×), the 5 duplicate next-module placements, and the three conflicting hour targets (0m/120m vs 20h/14d vs 10h) — cut the dashboard from ~16 sections to ~6
- Daily plan: ONE plan per day; budget split by per-roadmap weight (focus 70% default) — not N interleaved 4-block plans; starting a new roadmap at 3pm must invalidate today's cached plan
- Pace honesty: allocation weights or a sequential queue ("PE, then resume AI Agents") so two roadmaps stop each claiming your full weekly hours — **decision: weights vs queue (try both in Phase 4 notes)**

## Phase 6 — SRS health: caps + equivalents (R4c) *(1 session; MUST land before a third deck)*

- Intake caps: per-roadmap `newCardsPerDay` (default 10) + global `maxReviewsPerDay` (default 100); over-cap cards wait "queued", not due — in Settings, defaults sensible
- Bankruptcy valve: overdue > 3× daily cap → offer "Spread backlog over 7 days" (reschedule with jitter, logged)
- Review default = **all due, interleaved, focus roadmap first**, scope chip to narrow; due counts always global
- `EQUIVALENTS` authored map (one file per new roadmap, one-directional): seeding a module whose equivalent is Confident+ seeds only the delta, and credit is partial (stage → Learning, never Mastered)
- `externalPrereqs` cross-roadmap edges (AI Agents Phase 4 ↔ PE Phases 1–2) — engine stays blind, these are just globally-unique ids

## Phase 7 — Accessibility & interaction debt *(1 session)*

- Command palette: focus trap, `role="combobox"` + `aria-activedescendant`, focus returned on close
- Roadmap graph: roving tabindex (1 Tab stop, not 60), `aria-label` on the svg, fix 61 label-content-name mismatches (voice control)
- One `<h1>` per page (SectionHead gains a level prop); skip-to-content link; `ul > span` fix on /projects
- Destructive actions: journal delete confirm + undo; touch targets ≥ 40px (plan checkboxes are 13×13 today, tabs/chips 26px)
- Empty states: Review "your deck is empty" vs "nothing due"; forecast chart empty-state sentence; seed list "show all"; collapse not-started project trackers (/projects is ~10 screens)
- Accent discipline on Today (one primary button per view); dedupe triple "Planning" status labels; map legend shape+color; search button name contains "Search…" and shows Ctrl vs ⌘ per platform

## Phase 8 — Chatbot Development curriculum *(1 authoring session + study)*

Author the full curriculum exactly like PE (42-module scale optional; reuse the PE template **plus** the Phase-6 additions: EQUIVALENTS to AI Agents/PE, externalPrereqs, shortTitle, per-module card budget). Chatbot before Automation because overlap reuse is cheapest (RAG, memory, evals, guardrails) and it needs no sandbox. Goes live through the Phase-3 Beta gate immediately.

## Phase 9 — AI Automation curriculum *(when you reach that study phase)*

n8n/Kafka needs hands-on infra; author when your study reaches it. The per-roadmap playground sandbox question (workflow builder) is decided here, not before.

## Phase 10 — Polish & public *(later)*

Per-roadmap OG images · progress-share card (static PNG or read-only `/p#<base64>` URL) · `/` becomes Today for returning users (landing one click away) · history → IndexedDB if quota pressure appears · **AI Programming: author or remove — decide by end of Phase 8** (five roadmaps change the switcher math).

---

## Decisions log (owner: you)

| # | Decision | Default |
|---|----------|---------|
| 1 | AI Programming roadmap | Keep, author after Chatbot |
| 2 | Chatbot before Automation | Yes (overlap + no sandbox) |
| 3 | Today v2 plan split | Weights (70% focus) — revisit after Phase 4 notes |
| 4 | Review default scope | All-due interleaved (Phase 6) |
| 5 | Default site title | "Agent Academy — structured roadmaps for AI skills" |
