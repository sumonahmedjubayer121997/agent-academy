# Multi-Roadmap UX Plan — One App, Many Curricula

**Date:** 2026-10-24 · **Status:** Design proposal (awaiting go-ahead; nothing built yet) · **Baseline:** PR #15 (`e21c0f3`) — AI Agents fully live, Prompt Engineering curriculum authored, Automation & Chatbot skeletons only

---

## 1. Verdict on your idea

Your proposal — *a general menu bar with one general Today → choose a topic → that topic's own roadmap / build / review / learn / dashboard / journal sections* — is the correct model. It is how Duolingo works (one streak, many courses) and how roadmap.sh works (one site, many paths). One refinement makes it even better:

> **Make "Today" the single global home that aggregates every roadmap you have started** — one streak, all due review cards, one daily plan — and make each chosen topic a **workspace** containing the sections you love (Learn, Roadmap, Review, Build, Journal, Planner, Assessment).

Why one global Today instead of a Today per roadmap: your streak, study minutes, and momentum are *yours*, not the roadmap's. If you study PE for 40 minutes, the streak that matters is the one across everything. Duplicated per-roadmap dashboards split your history and invite neglect ("I did AI Agents today, PE can wait" becomes invisible). The global Today fixes that — and it still surfaces *per-roadmap next actions* ("PE: 6 cards due · next module: Few-shot examples").

## 2. The principle: one app, many curricula

Not four websites glued together. One learning OS where the **curriculum is a swappable cartridge**. Everything you love about the AI Agents experience is the *engine* (Today stack, SRS review, mastery gates, practice rows, journal, planner) — the roadmap is just the data plugged into it. This is already half-true technically: the active-roadmap context and content bundles exist (R2, PR #14).

## 3. Information architecture — what is global vs per-roadmap

| Section | Scope | Behavior |
|---|---|---|
| **Landing `/`** | Global | Roadmap catalog + "Continue learning" cards for started roadmaps |
| **Today `/dashboard`** | **Global aggregate** | One streak, one study-minutes log, due cards from ALL started roadmaps, daily plan mixing roadmaps, per-roadmap next-action cards, weekly report |
| **Roadmaps `/roadmaps`** | Global | The catalog (already built) — status chips become Live for each roadmap as it ships |
| **Learn** | Per-roadmap | `/r/:slug/curriculum` — that roadmap's phases/modules/lesson reader |
| **Roadmap map** | Per-roadmap | `/r/:slug/roadmap` — dependency graph scoped to that curriculum |
| **Review** | Per-roadmap by default | `/r/:slug/review` — that deck's due queue; a "mix all roadmaps" toggle for cross-training sessions |
| **Build** | Per-roadmap | `/r/:slug/projects` — that roadmap's portfolio trackers + practice rows |
| **Journal** | Tagged per-roadmap | `/r/:slug/journal` shows that roadmap's entries; a "show all" link on Today shows everything |
| **Planner** | Per-roadmap view, global settings | Weekly hours are set once; the planner shows pace for the active roadmap |
| **Assessment** | Per-roadmap | Each roadmap's own diagnostic (data already supports this) |
| **Resources, Glossary, Playground** | Shared global | Already roadmap-agnostic — unchanged |

## 4. The navbar answer (your main question)

The navbar you like does not grow a second level. It gains **one small control**: a roadmap switcher.

```
(•) Agent Academy   [Prompt Engineering ▾]    Today  Learn  Review  Build  Journal   More ⌄   ⌘K  ☾
      logo              switcher (active          └── global ──┘ └──── per active roadmap ────┘
                          roadmap name; dropdown
                          lists all live roadmaps)
```

- **Today** always goes to the global dashboard.
- **Learn / Review / Build / Journal** go to the *active roadmap's* version of that section.
- The switcher is a quiet dropdown (name + chevron, Linear-style) listing: AI Agents · Prompt Engineering · (later) AI Automation · Chatbot Development — plus "All roadmaps →" to the catalog.
- Your last-selected roadmap is remembered (localStorage), so returning users land where they left off.
- Mobile: the switcher sits at the top of the hamburger menu as a compact segmented row; pillars below it, unchanged.
- The 5-pillar constraint survives. Nothing else moves.

## 5. URL & progress model (already 80% ready)

- **URLs:** `/r/prompt-engineering/curriculum`, `/r/prompt-engineering/review`, etc. Legacy paths (`/curriculum`, `/review`, …) keep meaning AI Agents **forever** — no broken links, no lost history.
- **Progress:** every PE module id is `pe-`-prefixed, AI Agents ids are not — records are already roadmap-attributable **with zero migration**. The streak, SRS scheduling, and study log are global by design (one per person).
- **Reviews mix:** each roadmap owns its deck; the queue shows the active roadmap's due cards by default with a one-click "all roadmaps" mode once you have started more than one.
- **Mastery gates, evidence links, autonomy ladders:** identical rules everywhere — the engine does not know which cartridge is inserted.

## 6. What the user flow feels like

1. **First visit:** Landing → catalog → pick a roadmap → its Assessment → first daily plan appears on Today.
2. **Daily loop:** open the app → **Today** (global) → "PE: 6 cards due, next module Few-shot · AI Agents: streak at risk, 1 lesson behind pace" → one click drops you into that roadmap's section.
3. **Switching focus:** switcher dropdown → different cartridge, same beloved sections, same muscle memory.
4. **Starting a second roadmap:** catalog → "Start" → its diagnostic credits what you know → its cards join your Today automatically.

## 7. Phased build plan

| Phase | Work | Effort | Result |
|---|---|---|---|
| **R4a — Engine** | `/r/:slug/…` route tree; migrate page content imports to `useActiveRoadmap()`; navbar switcher; scoped Review/Journal/Planner; global Today aggregates multiple roadmaps | ~2 sessions | Engine is roadmap-blind |
| **R4b — PE goes live** | Flip PE status to `live`; catalog card becomes "Open roadmap"; deep links live | minutes (config) | **Prompt Engineering fully playable: all six sections you love** |
| **R5 — AI Automation curriculum** | Author the full curriculum (like PR #15 did for PE): n8n/Kafka phases, modules, practice projects, checkpoints, diagnostic, tracks, deck | 1 authoring session + your study | Automation roadmap live |
| **R6 — Chatbot Development curriculum** | Same authoring pattern | 1 authoring session + your study | Chatbot roadmap live |
| **R7 — Polish (optional)** | Per-roadmap OG images, cross-roadmap weekly report email-style summary, catalog "continue" chips | later | Delight |

## 8. Two small decisions for you (defaults chosen)

1. **Default review scope when multiple roadmaps are started** — *Default: active roadmap only, with visible "mix all" toggle.* (Alternative: always mixed.)
2. **Journal** — *Default: entries tagged per roadmap, per-roadmap view + global "all entries" list on Today.* (Alternative: strictly separate journals with no global view.)

## 9. Honest constraints

- **Content is the long pole, not design.** The workspace for AI Automation and Chatbot Development will be empty until their curricula are authored the way PE's just was. The engine work (R4a) is done once; each new roadmap after that is an authoring task.
- **Playground stays global** until a roadmap genuinely needs its own sandbox (an n8n-style workflow builder would be the first real case — worth it only when you reach Phase 3 of Automation).
- **No accounts yet** — progress stays in the browser per device, exactly as today.
