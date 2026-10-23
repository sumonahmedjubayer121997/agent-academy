# Phased Build Plan — Improving Agent Academy Step by Step

**What this is:** the execution guide that merges the two previous reports — [ROADMAP_REPORT.md](ROADMAP_REPORT.md) (architecture, MVP, P1/P2 features) and [LEARNING_ACCELERATION_REPORT.md](LEARNING_ACCELERATION_REPORT.md) (evidence-based learning features) — into one ordered, step-by-step plan.
**How to read it:** eight build phases, **W0–W7** ("W" = website, to avoid confusion with curriculum Phases 1–8). Each phase has a goal, numbered steps sized for one sitting each, acceptance tests, and what you learn by building it. Phases W0–W2 can start today; W4+ deliberately wait for your curriculum study to catch up — that's the build-with-phase principle: the website grows exactly as fast as your skills do.
**Date:** 2026-10-23

---

## 0. Working rhythm (applies to every phase)

One feature = one branch = one PR = one merge. Small and constant beats large and rare.

```bash
git checkout -b w1/srs-queue      # branch per step (or small group)
# …build, test, verify in the running app…
git add -A && git commit -m "feat(srs): review scheduler with SM-2 intervals"
git push -u origin w1/srs-queue   # then open a PR on GitHub and merge it
```

**Definition of done for every step:**
1. `npm run build` passes (types + bundle).
2. The feature is reachable in the UI and works with an empty progress store (fresh visitor).
3. No statistic anywhere is fabricated — new numbers derive from recorded data only.
4. The PR description states what changed and how to test it in two sentences.

Track steps as GitHub issues (label `W0`–`W7`); closing an issue by merging its PR is itself a small habit loop.

---

## Phase W0 — Harden what exists (start today; ~2–3 sittings)

**Goal:** protect the codebase before growing it: tests, CI, a public URL. After W0, no broken code can reach `main` unnoticed.

1. **Add Vitest + Testing Library.** `npm i -D vitest @testing-library/react @testing-library/jest-dom`; add `"test": "vitest run"` to `package.json`; add `src/test/setup.ts`.
2. **Test the pure logic first** — `src/store/progress.tsx` helpers: `streak()` (gap days, yesterday rule, streak freeze later), `isUnlocked()`, `phaseStats()`/`totals()` math, planner-week arithmetic from `Planner.tsx` (extract `buildSchedule()` into `src/lib/schedule.ts` so it's testable without React). Target: every calculation on the Dashboard has a test.
3. **Test one component** — `RoadmapGraph` renders all 44 nodes; clicking a node navigates; `VectorSim` cosine readout matches hand-computed values.
4. **GitHub Actions CI.** `.github/workflows/ci.yml`: on push/PR → `npm ci`, `npm run build`, `npm test`. Watch it go green on the PR from step 3.
5. **Deploy to Vercel** (import repo, framework: Vite, SPA fallback is automatic). Add the URL to the README. Private repo → preview URLs are protected; that's fine for now.
6. **README badge** for CI status.

**Acceptance:** pushing a PR with a failing test blocks merge; `https://<your-app>.vercel.app` loads the live roadmap.
**You learn:** pytest-shaped thinking in JS, CI gates — direct rehearsal of curriculum Phase 1 (Git/testing module).

---

## Phase W1 — The retention engine (the highest-value feature of the whole plan; ~4–6 sittings)

**Goal:** make the platform stop you forgetting: spaced-repetition queue + confidence calibration + pre-questions.

1. **Extract quiz items into cards.** Every `Lesson.quiz` question gets a stable `cardId` (`lesson:agent-loop:q2`). No new content needed — the content already exists.
2. **SRS scheduler as pure code.** `src/lib/srs.ts`: SM-2-lite — `next(card, grade: 0|1)` → `{ease, intervalDays, due}`. First review intervals: 1d, 3d, 7d, then ease-adjusted growth; a lapse resets to 1d with ease penalty. **Write the tests first** (this is deliberate-practice homework: pure functions, edge cases = failing intervals, leap days, clock injection).
3. **Wire into the store.** Add `srs: Record<cardId, …>` to `ProgressData` (additive, default-empty — no migration, per the data-model section of the learning report). Record a card schedule whenever a lesson quiz is submitted.
4. **Review session UI.** Dashboard card: "Reviews due: N · ~M min" → `/review` page: one question at a time, answer, reveal + explanation, self-grade ("got it / missed"). Grade 0/1 feeds the scheduler.
5. **Confidence calibration.** Before a lesson quiz: "sure / shaky / lost" tap → stored per module. Dashboard: calibration card comparing confidence vs actual quiz accuracy ("you said 'sure' on modules where you average 62%").
6. **Pre-questions.** One cold-recall question shown before section 1 of each lesson, sourced from its prerequisite module's quiz.

**Acceptance:** take the embeddings quiz today → the dashboard shows it due tomorrow → reviewing it after 1 day schedules it +3d; the calibration card renders with real ratios after 3+ quizzes.
**You learn:** algorithm design on familiar ground, test-first habits — Phase 1–2 level engineering, painlessly.

---

## Phase W2 — Depth layer + authoring rhythm (~ongoing, 1–2 sittings of platform work)

**Goal:** support the content flywheel: as you study each curriculum module, authoring its lesson becomes fast and the lesson can go as deep as you want.

1. **Go-deeper layers.** Optional `deeper: string[]` per lesson section (collapsed by default, styled like the exercise solution).
2. **Glossary.** `src/content/glossary.ts` (term → 2-line definition + related module); tooltip component wraps marked terms in lesson prose.
3. **Elaboration prompts on edges.** Prerequisite edges get an optional `why: string`; module pages show "Why does this require X?" with reveal.
4. **Content tooling (tiny).** A TypeScript type-check authoring checklist in `docs/AUTHORING.md` — the 9 sections, what makes a good analogy, demo criteria. Low effort, keeps future-you honest at 11pm.
5. **Start the flywheel.** Rule: finish studying a module → author its lesson within 48h → its quiz joins the SRS pool. Two lessons exist; the third is yours to write.

**Acceptance:** one new lesson fully authored by you passes type-check and renders; glossary tooltip appears on ≥1 term.
**You learn:** the Feynman technique operationalized — authoring is revision.

---

## Phase W3 — Analytics, focus, honest planner (~3–4 sittings)

**Goal:** make the platform tell you what's *working*, not just what's done — and make daily consistency frictionless.

1. **Session log.** `sessions: {moduleId|'review', minutes, at}[]` in the store; "Mark today as a study day" is replaced by (or augments with) a lightweight session logger.
2. **Focus mode.** Distraction-free lesson pane + 25-min timer → on completion auto-logs a session. Keyboard: `f` to toggle.
3. **Planner v2.** Weekly plan now includes SRS load as first-class items ("Tue: 12 reviews ≈ 8 min") and a daily **minimum viable session** (due reviews + one lesson section ≈ 15 min). ETA recalibrates from demonstrated pace: `avg(sessions last 14d)` overrides the nominal weekly hours once ≥5 sessions exist.
4. **Analytics 2.0.** Hours per phase bar chart, retention forecast (cards due next 7 days), weak-topic radar (accuracy by module from quiz history), pace-vs-plan line. Pure SVG (no chart lib yet — educational), revisit a library later if needed.
5. **Interleaved practice set.** "Mixed practice" button: 10 questions sampled across completed modules weighted by weakness/due-ness (reuse the review page).

**Acceptance:** after a week of real use, the dashboard reflects your actual study pattern; the ETA moved because of logged sessions, not wishes.
**You learn:** exactly the Phase 2 data-viz + statistics content, on data you care about.

---

## Phase W4 — The backend begins (⚠️ build only while studying curriculum Phase 4)

**Goal:** your first production LLM layer — server-side, provider-independent, schema-validated. This is where the website starts being an AI application rather than a site about one.

1. **FastAPI service.** `server/` directory: `/health`, `/api/critique` stub, Pydantic models, env config (`SERVER_ONLY` key handling), pytest.
2. **Provider-independent layer.** `server/llm/` with one interface (`complete(messages, schema|tools)`) and two adapters (one cloud provider + Ollama local). Selection by env var. **No key ever leaves the server** — the React app only ever calls your API.
3. **Feynman critique endpoint.** `POST /api/critique {lessonId, text}` → validated JSON response `{gaps: string[], strengths: string[], score: 0–10}` via structured outputs, with a strict prompt you can regression-test.
4. **Critique UI.** Feynman boxes (from W2's rhythm; add the box now if not yet) get a "Get feedback (uses my API, ~$0.002)" button — response clearly labelled as model output.
5. **Golden-set tests.** 10 fixed Feynman texts → assert the critique JSON validates and scores move in the right direction. Your first LLM eval suite.
6. **Docker Compose** for server + (optional) Ollama.

**Acceptance:** `docker compose up` → the deployed site's Feynman critique works end-to-end with either provider behind the same interface; the eval suite runs in CI.
**You learn:** literally curriculum Phase 4 — APIs, structured outputs, function-calling patterns, cost control, on a real product.

---

## Phase W5 — Ask the Roadmap: RAG over your own curriculum (⚠️ curriculum Phase 5)

**Goal:** a cited Q&A over the curriculum content itself — your first full RAG system, with a user who asks real questions (you).

1. **Ingestion pipeline** for `src/content/*.ts` (export to JSON → chunk by section with metadata).
2. **Embeddings + local vector index** (Chroma or a NumPy store — start simple).
3. **Hybrid retrieval + reranking** over lesson sections and resources.
4. **Answer endpoint with citations** → answer text + section links; refusal when evidence is insufficient.
5. **Eval harness:** 30 golden questions about the curriculum (real ones you had), measure hit-rate@5 and faithfulness; publish the table in the README of the server.
6. **UI:** search-bar → cited answers, linked back into lesson pages.

**Acceptance:** asking "why does cosine ignore length?" returns the embeddings lesson section with a citation; the eval table exists with real numbers.
**You learn:** the whole of curriculum Phase 5 — on your own product.

---

## Phase W6 — The live playground + real agents (⚠️ curriculum Phase 6)

**Goal:** replace the scripted playground with a real agent loop you wrote — the simulation stays as an offline fallback.

1. **Agent runtime in the server** (no framework first: the bare loop from the Agent Loop lesson, with step budget and tool registry).
2. **Three safe tools** (web search via a free API, calculator, fetch-page) with least-privilege execution.
3. **The approval gate, for real:** irreversible tool requests return `requires_approval`; the UI shows the same Approve/Reject card the simulation taught you.
4. **Rebuild the same flow in LangGraph** (checkpointing, interrupts) behind the same API — A/B them honestly and write up the trade-off.
5. **One MCP server** exposing a curriculum tool ("list modules due today") consumed by the agent.
6. **Agent evals:** 20 fixed tasks in CI (tool selection, gate behavior, budget adherence).

**Acceptance:** a stranger can give the live playground a goal, watch real tool calls with real latency, and feel the approval gate stop the run.
**You learn:** the heart of curriculum Phase 6, on the exact loop you've been watching in simulation since day one.

---

## Phase W7 — Production hardening + launch (⚠️ curriculum Phase 7–8)

**Goal:** the website becomes the portfolio centrepiece: deployed, observed, evaluated, secure, public.

1. Auth (magic link or OAuth) + per-user progress sync (Postgres or Firebase — you decide and defend the choice in the README).
2. Rate limits, cost caps per session, provider fallback chain.
3. Observability: structured logs, request tracing, an LLM-call dashboard (tokens, latency, $ per feature).
4. Security pass: prompt-injection red team on Feynman critique + agent tools; write the security note.
5. CI upgrade: evals from W4/W6 run on every PR; preview deploys.
6. **Launch:** repo public, Vercel production URL, landing refresh with a 60-second demo video, "built while learning" essay on the README, topics `ai-agents react typescript llm rag`.
7. Final: run the Projects page's README skeleton against Agent Academy itself.

**Acceptance:** the capstone checklist applied to this very site: a stranger can use it, an engineer can trace it, you can defend every choice.
**You learn:** curriculum Phase 7–8 by shipping the thing you've been building all along.

---

## Summary: the whole plan on one screen

| Phase | Theme | When | Effort | Headline deliverable |
|---|---|---|---|---|
| W0 | Harden | now | 2–3 sittings | CI green + live URL |
| W1 | Retention engine | now | 4–6 sittings | SRS reviews + calibration |
| W2 | Depth + flywheel | now/ongoing | light | Go-deeper, glossary, your 3rd lesson |
| W3 | Analytics + focus | ~P2 study | 3–4 sittings | Honest planner v2, focus mode |
| W4 | Backend + LLM layer | with P4 study | W4 is a real project | FastAPI + Feynman critique + evals |
| W5 | Ask the Roadmap (RAG) | with P5 study | real project | Cited Q&A + eval table |
| W6 | Live playground (agents) | with P6 study | real project | Real agent + approval gate |
| W7 | Production + launch | with P7–P8 | capstone | Public, monitored, secure |

Rule of thumb when in doubt: **if study and build conflict, study wins for W4+** — the platform's purpose is the engineer, not the other way around. W0–W3 never conflict; they *are* Phase 1–3 practice.

*(All timings are estimates; all features follow the non-negotiables — honest statistics, clearly-labelled AI, content-as-data, keys server-side.)*
