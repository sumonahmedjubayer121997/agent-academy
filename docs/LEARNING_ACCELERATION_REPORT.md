# Learning Acceleration Report — Features That Make Agent Academy Teach Faster

**Purpose:** a feature plan for the platform, driven by one question: *what has been shown to actually speed up learning and make it stick?* This complements the engineering roadmap in `ROADMAP_REPORT.md` (tiers: content, polish, engineering, AI-native) — everything here is about the **learning experience**, not the plumbing.
**Date:** 2026-10-23

---

## 1. Executive summary

Agent Academy already has structure (roadmap, prerequisites, checkpoints) and honesty (real progress only). What it lacks are the mechanics that cognitive science consistently ranks as the highest-yield learning techniques:

| Principle (plain language) | Platform feature |
|---|---|
| **Retrieval practice** — pulling knowledge out beats putting it in | Quizzes everywhere, low-stakes and frequent |
| **Spacing** — reviewing just before you forget | Spaced-repetition review queue |
| **Interleaving** — mixing topics beats blocked practice | Mixed practice sets |
| **Elaboration & generation** — explaining in your own words | Feynman mode, connection prompts |
| **Dual coding** — words + visuals together | Interactive demos per concept (started) |
| **Deliberate practice** — targeted drills with instant feedback | Exercise runner, adaptive weak-spot drills |
| **Metacognition** — knowing what you don't know | Confidence calibration, analytics |
| **Consistency** — regular small sessions beat rare marathons | Minimum-viable sessions, focus mode, planner v2 |

One honest caveat that shapes everything below: **features don't learn for you.** Each feature exists to remove friction from good habits or to add difficulty of the *desirable* kind. Anything that doesn't do one of those two things is decoration and gets cut.

---

## 2. The learning principles, and what each means for this platform

1. **The testing effect.** Being *asked* and struggling to recall strengthens memory far more than re-reading — even when you get it wrong. → Every page of content should be paired with retrieval; quiz scores should be frequent, low-stakes, and expected to be imperfect.
2. **Spacing effect.** Memory decays on a predictable curve; reviewing at increasing intervals flattens it. → The platform must schedule re-exposure automatically — you should never have to remember to revise.
3. **Interleaving.** Practising related skills mixed together (Python + math + ML recall in one set) feels harder and performs worse *during* practice, but dramatically better later — it trains *selecting* the right idea, not just executing it. → Mix quiz items across modules; real problems never announce which chapter they're from.
4. **Elaborative interrogation & self-explanation.** Answering "why is this true? why does this follow?" builds the connections that make knowledge usable. → Prompts and free-text explanation built into lessons.
5. **Generation effect.** Information you produce yourself is remembered better than information you receive. → Exercises first, solutions second (already the pattern); "explain it back" boxes.
6. **Dual coding.** Text + matching visual representation beats text alone; *interactive* visuals beat static ones. → No concept ships without something you can poke (the existing `VectorSim`/`LoopVisual` pattern).
7. **Cognitive load management.** Working memory is ~4 items; depth must be layered, not dumped. → Progressive disclosure: clean core path, optional "go deeper" layers.
8. **Deliberate practice.** Improvement comes from targeted work at the edge of ability with immediate feedback — not from repeating what's comfortable. → Adaptive drills aimed at your weakest tags, not your strongest.
9. **Metacognitive calibration.** Feeling of knowing ≠ knowing; learners who can accurately self-assess allocate time efficiently. → Confidence ratings compared against actual quiz accuracy.
10. **Consistency & habit.** A 25-minute daily session outperforms a 4-hour Sunday marathon, on retention and on schedule survival. → The product must make "today's minimum" always visible and always achievable.

---

## 3. The features, organised by learning goal

### A. RETAIN — stop forgetting what you learned

**A1. Spaced-Repetition Review Queue** *(the single highest-value addition)*
- **What:** every quiz question and key concept becomes a review card. After each quiz, cards enter an SM-2-style scheduler (ease factor, growing intervals). The dashboard shows "Reviews due today: 7 · ~6 min". Reviewing = re-answering, never re-reading.
- **Why:** spacing converts study hours into permanent knowledge instead of weekly evaporation.
- **How:** extend the progress store: `srs: Record<cardId, { ease, intervalDays, due, reps, lapses }>`. Reuse quiz items as cards — no separate authoring burden. One `ReviewSession` component on the dashboard.
- **Effort:** M · builds with Phase 1 study (pure TypeScript, perfect first real test suite).

**A2. Pre-questions on every lesson**
- **What:** before section 1 of a new lesson, one cold-recall question from the prerequisite lesson ("From the Agent Loop: what stops a loop from running forever?").
- **Why:** the pretesting effect — attempting retrieval *before* learning primes the mind and improves subsequent encoding, even from failed attempts.
- **Effort:** S · one component + one field per lesson.

**A3. Interleaved practice sets**
- **What:** a "Mixed practice" mode pulling items from all completed modules, weighted toward due/weak cards. Offered at the end of each week in the planner.
- **Why:** trains recognition of *which* knowledge applies — the actual skill interviews and production work test.
- **Effort:** S once A1 exists · needs quiz items tagged by concept.

### B. UNDERSTAND — go deeper, in detail, without the noise

**B1. Progressive disclosure inside lessons ("layers")**
- **What:** each section gets a collapsed "Go deeper" layer with the university-level detail (derivations, papers, edge cases). Core path stays clean; depth is one click away.
- **Why:** cognitive load management — beginners aren't drowned, and the platform still delivers the MSc-level detail you asked for, exactly when wanted.
- **Effort:** S · a `deeper: string[]` field + reusable `<details>` styling.

**B2. Elaborative connection prompts**
- **What:** dependency edges in the roadmap become clickable: "Why does RAG require embeddings? — answer in your own words" (with a model answer to compare).
- **Why:** elaborative interrogation; also cements the *structure* of the field, which is what makes experts fast.
- **Effort:** M · one `why` field per edge (author incrementally, highest-traffic edges first).

**B3. Numerical sandboxes per concept** *(extend the existing demo pattern)*
- **What:** token-cost calculator (type a prompt, see price/latency across models), chunking A/B simulator (see retrieved chunks change retrieval quality), temperature/top-p sampling curve, attention matrix explorer, BM25-vs-cosine scoring race.
- **Why:** manipulating parameters builds causal intuition that prose cannot; each sandbox is a 10×-revisited micro-lab.
- **Effort:** M each · naturally built while studying the corresponding Phase 3–5 module — the sandbox *is* the studying.

**B4. Concept glossary with live cross-linking**
- **What:** hover any underlined term → definition card + links to the lesson that teaches it; all definitions in one data file.
- **Why:** vocabulary is the skeleton of a field; instant lookup removes the friction that otherwise skips ("I'll look that up later" → never).
- **Effort:** M · one `glossary.ts` + tooltip component; add terms as lessons are authored.

### C. APPLY — turn understanding into skill, efficiently

**C1. In-browser exercise runner (Pyodide)**
- **What:** Phase 1–2 coding exercises run in a sandboxed Python (Pyodide/WebAssembly) editor with test assertions — instant pass/fail, zero environment friction.
- **Why:** the gap between "understood" and "can type it" is where learners quietly fail; instant feedback loops make practice volume cheap. Kills the 20-minute "set up a venv for this 5-line exercise" tax.
- **Effort:** L but bounded (one `CodeExercise` component reused by all lessons; exercises are data).
- **Note:** keep it optional — local practice remains the real skill; the runner is for reps, not the portfolio.

**C2. Adaptive weak-spot drills**
- **What:** a drill mode that samples items by tag-weighted weakness (accuracy × recency) from quiz history, hardest-first, and feeds results back into the SRS queue.
- **Why:** deliberate practice — spend time where the deficit is, not where it feels good.
- **Effort:** M · depends on A1 + tagged items.

**C3. Project scaffolder**
- **What:** each checkpoint project gets a "generate starter" button: repo structure, README skeleton, pytest config, and the milestone checklist as GitHub-issue text you can paste.
- **Why:** projects teach the most per hour — but only the parts *you* build. Boilerplate isn't learning; removing it raises project completion rate.
- **Effort:** M · template files per project, zip download.

**C4. Feynman mode ("explain it back")**
- **What:** after each lesson, a private text box: "Explain this concept to a smart friend in ≤5 sentences." Stored, timestamped, and resurfaced when the topic's review comes due. Later (Phase 4+), an LLM critiques gaps against the lesson content — clearly labelled when that's a model.
- **Why:** the generation effect + self-explanation; writing forces the gaps into the open. Your accumulated explanations double as future blog/portfolio material.
- **Effort:** S now (box + storage), L later (LLM critique — which is itself Phase 4 practice).

### D. MANAGE — metacognition and time efficiency

**D1. Confidence calibration**
- **What:** before each quiz, one tap: "How confident are you in this material? (sure / shaky / lost)". Dashboard shows a calibration chart: confidence vs actual accuracy.
- **Why:** the most efficient learners allocate time by *real* gaps, not comfort; miscalibration ("Irecognise it, so I know it") is the #1 silent time-waster. Calibration also directly maps to interview performance.
- **Effort:** S · two fields + one chart.

**D2. Session timer + focus mode**
- **What:** optional focus mode: distraction-free lesson pane + 25-minute timer that, on completion, logs the session (module, minutes) into the activity log automatically.
- **Why:** effort tracking makes the analytics below meaningful; the visible timer is a commitment device; and automatic logging removes the "mark studied" chore.
- **Effort:** M · timer component + `sessions: [{moduleId, minutes, at}]` in the store.

**D3. Learning analytics 2.0 (still honest)**
- **What:** from logged sessions: hours per phase, retention forecast ("cards due next 7 days"), weak-skill radar (accuracy by concept tag), pace vs plan (planner's estimate vs actual — recalibrating the ETA with *your* demonstrated velocity).
- **Why:** you can't improve what you don't see; the current dashboard shows *what's done*, not *what's working*.
- **Effort:** M · pure functions over existing + D2 data; excellent chart-practice while studying Phase 2 data-viz.

**D4. Planner v2 — reviews built in, minimum-viable sessions**
- **What:** the weekly plan includes SRS review load as first-class items ("Tue: 12 reviews ≈ 8 min"); every day shows a 15-minute "minimum viable session" (today's due reviews + one lesson section) so a busy day never breaks the streak.
- **Why:** consistency beats volume; a plan that only has room for perfect days gets abandoned by week three.
- **Effort:** M · extends existing planner with A1 data.

### E. SUSTAIN — motivation without manipulation

**E1. Phase retrospectives (real celebrations)**
- **What:** on phase completion: a generated recap — hours logged, quiz arc, projects shipped, your own Feynman explanations from that phase. No confetti, no fake badges; your actual work, reflected back.
- **Effort:** S · reads existing data.

**E2. Learning journal with prompts**
- **What:** weekly reflection with three prompts: hardest idea / what finally clicked / what I'd teach someone else. One screen, 3 minutes, stored.
- **Why:** reflection consolidates transfer and feeds the portfolio narrative later.
- **Effort:** S.

**E3. Streak freeze & honest streaks**
- **What:** one "freeze" per month auto-consumed by a minimum session (reviews only) on a missed day; streak counts *effort days*, not perfection.
- **Why:** streak anxiety produces quitting, not learning. Design for the human.
- **Effort:** S.

---

## 4. What NOT to add (efficiency by subtraction)

- **XP, levels, leaderboards, badges** — extrinsic rewards erode intrinsic motivation for cognitively complex work; the evidence points the wrong way for this use case.
- **An AI chatbot on every page (before Phase 4)** — a permanent answer-machine is a *retrieval-practice killer*: it converts recall into copy-paste. The tutor belongs in deliberate, labelled doses (C4 critique mode).
- **Autoplaying video walls** — passive consumption masquerading as progress; this platform is deliberately interaction-first.
- **Notification spam / email digests** — one calm review card on the dashboard is enough; the platform should be pulled, not pushing.
- **More resource lists** — 26 verified links beat 500 uncurated ones; curation *is* the feature.

---

## 5. Data model changes (concrete)

```ts
interface ProgressData {
  // existing…
  moduleStatus: Record<string, ModuleStatus>
  activity: string[]
  quiz: Record<string, QuizResult>
  weeklyHours: number
  assessment: { done: boolean; applied: boolean; scores: Partial<Record<Domain, number>> }
  // additions (all optional-defaulted → no migration)…
  srs: Record<string, { ease: number; intervalDays: number; due: string; reps: number; lapses: number }>
  confidence: Record<string, 'sure' | 'shaky' | 'lost'>   // per module, pre-quiz
  feynman: Record<string, { text: string; at: string }[]> // per lesson
  sessions: { moduleId: string | 'review'; minutes: number; at: string }[]
  journal: { week: string; hardest: string; clicked: string; teach: string }[]
}
```

Same principle as before: additive fields, localStorage-compatible, swappable to Firestore later; every displayed statistic still computed from recorded activity only.

---

## 6. Rollout plan (build-with-phase, prioritised)

| # | Feature | Principle | Effort | Build during |
|---|---|---|---|---|
| 1 | A1 Spaced-repetition queue | Spacing + retrieval | M | Phase 1 (also = your first test suite) |
| 2 | D1 Confidence calibration | Metacognition | S | Phase 1 |
| 3 | A2 Pre-questions | Pretesting | S | Phase 1–2 |
| 4 | B1 Go-deeper layers | Cognitive load | S | Phase 2 |
| 5 | D2 Focus timer + session log | Consistency | M | Phase 2 |
| 6 | E2 Journal, E3 streak freeze, E1 retrospectives | Sustain | S | Phase 2 |
| 7 | D3 Analytics 2.0 + D4 Planner v2 | Metacognition | M | Phase 2 (data-viz practice) |
| 8 | B4 Glossary, B2 Connection prompts | Elaboration | M | Phase 3 (author as you learn) |
| 9 | B3 Numerical sandboxes | Dual coding | M each | Phases 3–5 (each = the module's own project) |
| 10 | A3 Interleaved sets, C2 Adaptive drills | Interleaving, deliberate practice | S/M | Phase 3 (needs tagged items) |
| 11 | C4 Feynman mode | Generation | S (LLM critique: Phase 4) | Phase 3→4 |
| 12 | C1 Pyodide exercise runner | Feedback loops | L | Phase 4 (async + tooling practice) |
| 13 | C3 Project scaffolder | Transfer | M | Phase 5–6 checkpoints |

Quick wins if you want visible change this week: **A1-lite** (review reminders from existing quiz history, no scheduler yet), **D1**, and **B1** — all small, all high-leverage.

---

## 7. How this makes learning *faster* (the mechanisms, honestly)

- **Less re-learning:** spacing + retrieval mean each hour is spent once, not repeated monthly. This is the biggest single time-saver in the plan.
- **Less wasted time:** calibration + analytics aim your hours at real gaps; the planner trades heroic plans for survivable ones.
- **Less illusion, more signal:** frequent low-stakes testing + confidence checks replace the false comfort of "I watched/recognise it".
- **Deeper per hour:** elaboration prompts, sandboxes, and Feynman mode force the processing that reading alone never triggers — detail *in*, connections *between*.
- **More transfer:** interleaving and projects practise *choosing and applying* knowledge, which is what interviews and production systems actually test.

And the honest footnote: all of this compounds on one non-negotiable — showing up. The features lower the cost of that and raise the return on it; they don't replace it.

---

## 8. How we'll know the features work

Measured, as always, only from real data: (a) quiz accuracy on spaced items vs never-reviewed items over time; (b) streak survival across busy weeks; (c) module completion rate before/after planner v2; (d) self-reported friction per session (one tap: smooth/hard); (e) Feynman-explanation length and specificity as a qualitative depth signal. If a feature doesn't move its metric, it gets removed — including these.
