# Roadmap v2 — Audit Verification & Consolidated Plan

**What this is:** the external audit (Claude, 2026-10-23) was verified claim-by-claim against the
code and the live deployment; its recommendations are absorbed into one redesigned plan that
succeeds the W0–W7 build phases (see `PHASED_BUILD_PLAN.md`, complete). The earlier reports remain
as history; this is the working plan going forward.
**Date:** 2026-10-23 · **Status of main:** W0–W7 merged (PRs #1–#9) + this verification commit.

---

## 1. Audit verification scorecard

| Audit claim | Verdict | Evidence / action |
|---|---|---|
| "60 modules, not 44 as docs claim" | **TRUE — our copy bug** | `MODULES.length` = 60. UI copy, README and earlier reports said 44. README fixed in this commit; Curriculum fix rides with the in-flight wave |
| Deep links (e.g. `/dashboard`) 404 on Vercel; no `vercel.json` | **TRUE — live bug** | `curl …/dashboard → 404` reproduced. Fixed by committing `vercel.json` (SPA rewrites) in this commit |
| Deployed site cannot reach backend (`VITE_API_BASE` unset, default `127.0.0.1:8000`) | **TRUE — by design, poorly surfaced** | Public AI features degrade to honest "backend offline". Needs a host + env decision (§6) |
| Only 2 lessons have content; review deck nearly empty | TRUE | Content flywheel remains the #1 value driver |
| `load()` unvalidated, no schema version; export without import | TRUE | Adopted as V2.1 (P0) |
| Completion is one click; assessment credit marks modules `completed` | TRUE | The audit's strongest point — adopted as V2.2 evidence lifecycle |
| `nextUp` order-only, silent | TRUE | V2.5 explainable recommender (in flight: `lib/recommend.ts`) |
| Streak arithmetic DST-fragile; manual button extends streak | TRUE (minor) | V2.4 hardening: centralised calendar-date helper + tests |
| Graph: Enter-only, `role="img"` may hide nodes from AT | TRUE | V2.4 accessibility fixes |
| "The repo is public" | **Was false at audit time, true now** | Repo was private; it has since been made public. No personal data is in it (progress stays in the browser) |
| Bundle 374 kB / 118 kB gz; 29 tests pass | TRUE | Matches local runs |

## 2. Corrections to the record (ours to own)

1. **The 44→60 discrepancy was ours** — authoring expanded from the planned 44 to 60 modules and the
   prose never caught up. All computed UI numbers were always correct; only hand-written copy lied.
2. **The Vercel 404 was ours** — W0 shipped without `vercel.json`; nobody deep-linked during checks.
3. **The public AI gap was under-communicated** — deliberate (local-first, no keys needed) but the
   README presented the backend without saying the live URL can't reach it. Fixed here.

## 3. What we adopt, defer, or reject from the audit

**Adopted (becomes V2.x below):** R1 data safety, R2 evidence-based lifecycle, R3 topic records,
R4 Today/daily plan, R5 project tracker with defensibility checklist, R6 user cards + graded
review, R7 explainable recommender, R8 tracks + DSA content, R9 journal, R13 hardening.
**Deferred:** R10 gap map, R11 weekly reports (until records exist to report on); cloud sync
(keep local-first; IndexedDB only when localStorage strains — current data is kilobytes).
**Modified:** R12 assistant — the audit's own advice followed: a **non-LLM query layer first**
(`lib/localSearch.ts`, already in flight), LLM layer only later and read-only.
**Rejected for now:** replacing the landing page (it is the portfolio face; `/dashboard` is one
click away), accent-colour change (audit itself defers to contrast checks; current palette passes AA).

## 4. Current state: a V2 wave is already in the working tree

Reviewing the repository after the audit revealed a **large, uncommitted implementation wave**
(all tests green — 29 pass, build clean, bundle 439 kB):

| In flight (uncommitted) | Audit item |
|---|---|
| `src/content/cards.ts` (module flashcard deck) | R6 |
| `src/content/tracks.ts` (AI-Eng / ML-DS / Supporting tracks) | R8 |
| `src/lib/dailyPlan.ts`, Journal page | R4, R9 |
| `src/lib/backupDb.ts` (snapshots) | R1 |
| `src/lib/recommend.ts` | R7 |
| `src/lib/localSearch.ts` (non-LLM assistant queries) | R12-first-half |
| `progress.tsx` +~750 lines (mastery stages, evidence, history) | R2, R3 |
| `vercel.json` | committed in this release (see §1) |

**Next step for the wave:** slice-review → extend tests for the new pure logic (scheduler grades,
recommend reasons, backup round-trip) → commit as V2.3. Do not deploy main+wave until reviewed.

## 5. The v2 plan

- **V2.0 Verify & fix (this commit):** audit scorecard, README 60-fix, `vercel.json` rewrites, this document.
- **V2.1 Data safety (P0):** `schemaVersion`, validated load with per-field fallback + recovery copy,
  import with preview diff, last-5 snapshots, quota-error surfaced. Acceptance: corrupted storage
  never crashes and preserves the raw blob; export→import reproduces state; reset is undoable.
- **V2.2 Evidence lifecycle (P0):** five stages (Learning → Practising → Confident → Mastered);
  promotion rules visible; Mastered requires an evidence item; prior-knowledge credit becomes a
  separate marker that never counts as Mastered; migration from the 3-state model.
- **V2.3 Land the in-flight wave:** review + tests + commit the §4 work in reviewable slices.
- **V2.4 Records & planning:** R3 topic records (notes, questions, evidence links), R4 Today view
  with planned-vs-actual minutes, R5 project tracker; hardening thread (a11y, Space key, date
  helper + DST tests, backend auth gate if deployed).
- **V2.5 Intelligence:** R7 recommender surfaced with reasons, R10 bottleneck map; then R11 weekly
  reviews once ≥4 weeks of records exist.

The content flywheel (authoring the remaining 58 lessons while studying) runs *across* all of V2 —
platform work must never again consume the study time it exists to serve.

## 6. Decisions needed (from the audit + verification)

1. **Backend on the public URL?** Options: (a) keep local-first AI (current), (b) host on
   Railway/Fly behind a shared-secret header + set `VITE_API_BASE`. Recommendation: (b) when a
   real provider key is added; not before.
2. **DSA track:** add as a recurring ~2h/week strand (audit's suggestion) — yes/no.
3. **Storage:** local-first + file export for now (recommendation), IndexedDB at V2.4, cloud only
   if multi-device becomes real.
4. **Landing page:** keep as portfolio face (recommendation) — or redirect `/` to dashboard.
