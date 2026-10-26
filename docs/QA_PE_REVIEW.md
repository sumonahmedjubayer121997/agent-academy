# QA Review — Prompt Engineering Roadmap (Live Site)

**Date:** 2026-10-26 · **Target:** https://agent-academy-peach.vercel.app/r/prompt-engineering/… · **Method:** scripted browser walk of 10 PE pages (curriculum, roadmap map, both lessons, two module pages, review, projects, assess, planner) + link harvest on every page + external link checks · **Baseline:** PR #17 (`aef6b4a`)

> **RESOLVED 2026-10-26 — all findings fixed on branch `fix/pe-qa`** (critical link fix with id-aware legacy redirects + `/l/` lesson resolver; resources gated per roadmap; track chips, sequence options, and landing copy derived from data; h1s on page openers; new link-harvest guard test — 16 cases — now enforces that no roadmap-scoped page links outside its workspace). The guard itself caught two additional leaks beyond this report (ModuleDetail `/curriculum` back-link; Planner/Dashboard/dailyPlan recommending AI-Agents modules under PE).


---

## CRITICAL — every PE module and lesson link routes to the wrong roadmap

**Where:** Curriculum page (all 42 module cards), Review page (lesson links), ModuleDetail (prerequisite links), Projects (flagship "checkpoint" links), Roadmap page (bottleneck link), both lesson pages ("back to module").

**What happens:** these links emit legacy paths (`/roadmap/pe-mental-model`, `/learn/json-you-can-trust`). The legacy redirect is pinned to AI Agents, so the browser lands on `/r/ai-agents/roadmap/pe-mental-model` — the AI-Agents workspace — where the PE module does not exist.

**Verified end-to-end on production:**
- `/roadmap/pe-mental-model` → `/r/ai-agents/roadmap/pe-mental-model` → **"Module not found"**
- `/learn/json-you-can-trust` → `/r/ai-agents/learn/json-you-can-trust` → **"Lesson not found"**

**Impact:** a learner on the PE curriculum cannot open ANY module. This is the single most severe issue on the site today; it was masked in testing because direct `/r/prompt-engineering/...` URLs work and the per-bundle render tests never click the links.

**Fix (two layers, both needed):**
1. **Scope links at source** — every page that renders module/lesson links must build them from the active slug (`/r/${slug}/roadmap/${id}`). Known emitters: Curriculum module cards, ModuleDetail prereq list, Projects flagship tracker links (practice rows were fixed in P3; the flagship section was not), Review lesson links, lesson-page back-links, Roadmap bottleneck links.
2. **Make the legacy redirect id-aware** — `/roadmap/:moduleId` and `/learn/:lessonId` should resolve the roadmap from the id (the `/m/:moduleId` pattern already does this) instead of hardcoding `ai-agents`. This self-heals any surviving legacy link, bookmark, or shared URL.

## HIGH — PE module pages recommend AI-Agents resources

**Where:** every PE module detail page's resources section.
**What happens:** resources are filtered by the string `Phase N` against AI-Agents-authored data. `pe-mental-model` (PE Phase 1) shows Python/NumPy/pandas links; `pe-context-budget` (PE Phase 3) shows PyTorch/Karpathy/Attention links. A prompt-engineering learner is being recommended deep-learning material.
**Fix:** key resources per roadmap (`{ roadmap, phase }`) as the BUILD_ORDER already specifies; until PE resources are authored, show none rather than wrong ones.

## MEDIUM — AI-Agents copy hardcoded into shared pages

These render under `/r/prompt-engineering/…` but speak only about AI Agents:

| Page | Symptom |
|---|---|
| Roadmap map | Filter chips read "Track A · AI & Agents / Track B · ML & Data Science / Track C · Core Engineering" — the PE tracks are Complete / Builder / Evals & Safety. Filtering by A/B/C on the PE graph matches nothing. Section sub-copy also names the AA tracks. |
| Planner | Sequence-mode options show AI-Agents labels ("Prioritise Track B math & ML", ml-first) regardless of active roadmap. |
| Landing | "One live roadmap, four on the way" is now false — Prompt Engineering is a usable Beta; three roadmaps are coming. The teaser row also lost the PE card when it flipped to Beta (filter shows only coming-soon). |

**Fix:** derive filter labels from the active bundle's `TRACKS` (the data already exists per roadmap); sequence options from the bundle; refresh the landing copy to the Beta reality.

## LOW / known-debt (tracked, not new)

- **No `<h1>` on curriculum, roadmap, review, projects, assess, planner** (SectionHead renders `<h2>`; AA pages share this — the P7 accessibility item).
- **Review empty state** says "Nothing due right now" to a user with an empty deck (P7).
- **Review page lesson links** are the legacy `/learn/…` (covered by the critical fix).
- Graph button/ARIA model (60+ tab stops on AA; PE graph same pattern — P7).
- External lesson links: all six verified 200 (OpenAI x2, Anthropic, Hugging Face, pydantic, zod).

## What checked out clean

- All 10 PE routes load with correct titles; zero horizontal overflow on any page at 1280px.
- Both nine-layer lessons render fully: demos (Context Window Inspector, Structured Output Step-Through), quizzes, pre-question on "JSON You Can Trust".
- Module data, tracks, and the 42-node graph render; "All 42 Modules" label is computed correctly.
- The six further-reading external links all resolve.
- Practice-project module links are correctly scoped (fixed in P3).

## Recommended order

1. Critical link fix (source scoping + id-aware legacy redirect) — small, test-guardable (a link-harvest test that every internal href on key pages starts with `/r/{active-slug}/` or a known global route).
2. Resources per-roadmap scoping.
3. Track/sequence/label derivations from the active bundle.
4. Landing copy refresh.
5. h1 pass (P7 overlap).
