# Multi-Roadmap Plan — Keep the Engine, Grow the Catalog

**Date:** 2026-10-24 · **Status:** Approved direction (user decision: keep ALL existing AI-Agents functionality; add future roadmaps around it) · **Baseline:** PR #13 (`5f7c9d9`), 62 vitest green, live on Vercel

---

## 1. Decision

Agent Academy stays a **Vite + React SPA** (no Next.js rewrite) and keeps the entire learning engine — SRS review, mastery lifecycle & evidence gate, planner, journal, assessment, analytics, 40 practice projects, playground, ⌘K palette. Around that engine we build a **roadmap catalog layer** so the site can host multiple roadmaps:

| # | Roadmap | Status at R1 |
|---|---------|--------------|
| 1 | **AI Agents** (existing, 8 phases / 60 modules) | Live — full engine |
| 2 | AI Programming | Coming soon (skeleton) |
| 3 | AI Automation (n8n, Kafka) | Coming soon (skeleton) |
| 4 | Chatbot Development | Coming soon (skeleton) |
| 5 | Prompt Engineering | Coming soon (skeleton) — **recommended as roadmap #2 to go live** |

Why Prompt Engineering first when one goes live: it needs no sandboxes or infrastructure, it reuses everything the engine already has (lessons, cards, SRS, projects), and you can author it fastest from what you already know — the same reason it's the ideal *content-flywheel practice run* before the heavier roadmaps.

## 2. Invariants (non-negotiable while executing this plan)

1. **Existing module ids never change.** All progress lives in `aa-progress-v1` keyed by module id (`agent-loop`, `p1-*`-style ids, …). Restructuring is pure file moves + re-exports; a rename would wipe the user's history.
2. **The 62-test suite stays green through every refactor phase.** R1/R2 are behavior-preserving; tests are the proof.
3. **Design tokens as shipped in PR #13** (hairline borders, flat/raised/overlay cards, one accent, ≤5 nav pillars + More). Catalog cards reuse the existing `Card` — no new visual language, no serif experiment.
4. **No fabricated numbers.** Coming-soon cards show a status chip, never a fake lesson count or hours figure. Hours/lesson counts appear only when a roadmap's content is authored.
5. One active roadmap at a time in v1 of the engine; the SRS queue may span started roadmaps later (R4), but Dashboard/Planner are scoped to the active roadmap.

## 3. Target architecture

### 3.1 Content contract — one folder per roadmap

```
src/content/
  types.ts                      # shared: Phase, LearningModule, ProjectSpec, … (+ new RoadmapMeta)
  roadmaps/
    registry.ts                 # ROADMAPS: RoadmapMeta[]  ← single source of truth for the catalog
    ai-agents/
      index.ts                  # assembles + exports the roadmap bundle
      phases.ts  modules.ts  lessons.ts  edges.ts  tracks.ts
      assessment.ts  cards.ts  projects.ts  practiceProjects.ts
      roadmap.json              # RoadmapMeta (title, tagline, level, status, icon)
    prompt-engineering/         # R4: same shape, status: 'live' when content exists
      …
    ai-programming/             # R1: meta + phase skeleton only, status: 'coming-soon'
    ai-automation/
    chatbot-dev/
  resources.ts  glossary.ts     # stay shared (cross-roadmap library)
```

New shared type (in `types.ts`):

```ts
export type RoadmapStatus = 'live' | 'coming-soon'

export interface RoadmapMeta {
  slug: string            // 'ai-agents', 'prompt-engineering', …
  title: string
  tagline: string         // one line for the card
  description: string     // short paragraph for the catalog/detail
  level: 'Beginner-friendly' | 'Intermediate' | 'Advanced'
  status: RoadmapStatus
  icon: string            // lucide icon name
  plannedPhases?: Array<{ title: string; blurb: string }>  // coming-soon skeletons only
}
```

**Adding a roadmap = one folder + one registry line.** A coming-soon roadmap is valid with just `roadmap.json` (meta + `plannedPhases`). This satisfies the "new roadmap = one new file" goal without a platform change.

### 3.2 Routing — staged, no big-bang

- **R1–R3 (now):** existing paths stay exactly as-is and mean *the AI Agents roadmap* (`/dashboard`, `/roadmap`, `/curriculum`, `/learn/:lessonId`, …). New pages: `/roadmaps` (catalog) and `/roadmaps/:slug` (detail; for coming-soon, shows the phase skeleton + "notify me" journal prompt). Zero redirects, zero progress impact.
- **R4 (when roadmap #2 goes live):** introduce `/r/:slug/…` for the new roadmap; ai-agents keeps its legacy paths permanently (they're the default active roadmap). The active-roadmap context decides which content bundle the engine reads.
- **Landing page:** hero stays, plus a "Choose your roadmap" section of catalog cards (the existing 5-card pattern from the spec discussion, minus anything unauthored).

### 3.3 Engine scope per roadmap

| Engine piece | Behavior |
|---|---|
| Dashboard, Planner, Projects, Journal | Scoped to active roadmap via a `useActiveRoadmap()` context (R2) |
| SRS Review queue | May span all started roadmaps (cards carry a roadmap tag in schema v3 — R4) |
| Progress store | v2 until R4; v3 adds `roadmap` on records + migration that stamps existing records as `ai-agents` (ids untouched) |
| Assessment, tracks, card deck | Live inside each roadmap's folder; only loaded for `status: 'live'` |
| Resources, Glossary, Playground | Shared (already roadmap-agnostic) |

## 4. Phase plan

Each phase is ~1 working session unless noted. Acceptance criteria are checkable, not vibes.

### R1 — Content namespace + catalog *(foundation, behavior-preserving)*
- Move ai-agents content into `src/content/roadmaps/ai-agents/`, keep re-export shims at old paths so no page import changes yet (shims removed in R2).
- Add `RoadmapMeta`, `registry.ts`, and 4 coming-soon entries with phase skeletons (§5).
- New `/roadmaps` catalog page (cards: icon, title, tagline, level chip, status chip; live card links into the app, coming-soon cards link to detail).
- Landing gains the roadmap-cards section; "Roadmaps" added to the More menu.
- **Accept:** all 62 tests green with zero test edits; catalog renders 5 cards; existing progress intact (same localStorage keys/ids); Lighthouse-ish sanity on /roadmaps.

### R2 — Active-roadmap context + route scoping *(still no new roadmap)*
- `ActiveRoadmapProvider` (reads `/r/:slug` param, defaults `ai-agents`), replace direct content imports in pages with context access; delete shims.
- Roadmap graph config moves into the roadmap bundle (positions/edges are content, not app code).
- Breadcrumbs/page titles carry the roadmap name.
- **Accept:** tests green (update only imports/mocks); deep links behave identically; `document.title` per page.

### R3 — Catalog polish + SEO basics
- Per-page `<title>`/meta via a tiny `usePageMeta` hook; sitemap.xml + robots.txt in `public/`; OG image (one static, per-roadmap later).
- Coming-soon detail pages: phase skeleton + "start the AI Agents roadmap meanwhile" CTA.
- **Accept:** unique titles on every route; sitemap lists catalog + live roadmap routes; share preview renders.

### R4 — Roadmap #2 goes live: Prompt Engineering
- Author content (phases/modules/lessons/cards/practice projects) — **this is the user's work; the content flywheel applies.**
- Progress schema v3 (+ migration test), SRS queue spanning started roadmaps, roadmap switcher in nav (stays within 5-pillar constraint: switcher lives beside the logo, not as a 6th item).
- **Accept:** migration test proves v2→v3 keeps every existing record; review queue mixes both roadmaps; per-roadmap dashboard scoping correct.

### R5 — Repeatable go-live runbook (AI Programming → Automation → Chatbot)
- Templated checklist (§6) executed per roadmap; engine work should now be zero.
- Optional (only if public traffic becomes a real goal): prerender the catalog + marketing routes, or split a static content shell — revisit the Next.js question here, not before.

## 5. Draft phase skeletons (coming-soon content, R1)

*Deliberately titles + one-line blurbs only — hours/lesson counts are set at authoring time, never now.*

**AI Programming** — Intermediate. Write real software around models.
Foundations (Python/TS tooling) · LLM APIs & structured output · Code-generation patterns · Evals & observability · Shipping AI features safely.

**AI Automation (n8n, Kafka)** — Intermediate. Event-driven systems that run themselves.
n8n core & self-hosting · Workflows, triggers & webhooks · Integrating LLM steps · Kafka & event streams · Reliability, retries & monitoring.

**Chatbot Development** — Beginner-friendly→Intermediate. Conversational products people actually use.
Conversation design · RAG chatbots (reuses your FastAPI RAG backend patterns) · Memory & state · Multi-turn tool use · Channels (web/Telegram/WhatsApp) · Evaluation & guardrails.

**Prompt Engineering** — Beginner-friendly. The fastest complete roadmap to author.
Prompting fundamentals · Structured output & schemas · Few-shot & context engineering · Eval-driven prompting · Prompt security & injection defense · Domain playbooks.

## 6. How to add a new roadmap (the runbook this plan buys)

1. `mkdir src/content/roadmaps/<slug>`; write `roadmap.json` with `status: 'coming-soon'` + `plannedPhases`.
2. Add one line to `registry.ts`. → Catalog card appears automatically.
3. When authoring begins: add `phases.ts`, `modules.ts` (globally-unique ids — prefix with the slug), `lessons.ts`, `cards.ts`, `practiceProjects.ts`; flip `status: 'live'`.
4. If it's the first new live roadmap: progress schema must already be v3 (R4). Otherwise: nothing else.

## 7. Risks & what we are NOT building

- **Risk — silent import drift in R1/R2:** mitigated by keeping re-export shims until every consumer is migrated, and by the test suite.
- **Risk — engine assumes one roadmap (harder than it looks):** Dashboard/Planner/recommendations read module lists directly today; R2's context is the only safe seam. Budget a little refactoring patience there.
- **Not building now:** Next.js migration (revisit at R5 *only* if public SEO becomes a goal), multi-roadmap concurrent dashboards, accounts/sync, per-roadmap theming, i18n.
- **Standing reminder:** the engine is ahead of the content — 58 of 60 AI-Agents lessons are unauthored and zero study days are logged. This plan makes the *shell* ready for more roadmaps; only authoring makes them real.
