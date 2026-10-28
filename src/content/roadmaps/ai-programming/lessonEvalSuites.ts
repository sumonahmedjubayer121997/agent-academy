import type { Lesson } from '../../types'

export const EVAL_SUITES_LESSON: Lesson = {
  id: 'aip-eval-suites',
  moduleId: 'aip-eval-suites',
  title: 'Evals That Gate a Merge',
  minutes: 30,
  tagline: 'Unit tests prove your code still works; an eval gate in CI proves your feature still works.',
  takeaways: [
    'Unit tests pin deterministic code paths with a fake provider; eval suites measure behavioural quality across a golden dataset when prompts, schemas, or models change.',
    'Split your suite by speed and cost: a fast, deterministic or recorded-fixture gate on every pull request, and a larger live-model + calibrated-judge suite on merge or nightly.',
    'A score drop on a PR is not a build flake to re-run — either fix the prompt/code, split the task, or consciously update the golden baseline with a written reason.',
  ],
  relatedPractice: 'aip-pp-ci-eval-gate',
  pre: {
    q: 'From Phase 1 (Testing the non-AI layer) and earlier in Phase 4 (Metrics that matter): your unit tests pass 100% against FakeProvider, yet your production dashboard shows quality dropped after a one-line prompt edit. Why did CI let that merge through?',
    options: [
      'Because FakeProvider had a bug in its canned response',
      'Because unit tests script the fake provider’s output — they verify how your code handles a response, not how a real model responds to the edited prompt',
      'Because unit tests do not run on pull requests',
      'Because TypeScript does not type-check prompt strings',
    ],
    answer: 1,
    explain:
      'A fake provider makes unit tests fast and deterministic precisely by holding model output fixed. The moment you edit a prompt, change a schema description, or upgrade a model ID, you have changed behaviour that only an evaluation suite over a golden dataset can measure.',
  },
  simple: [
    'When you change normal application code — a retry loop, a cost calculation, a schema parser — a unit test tells you immediately if you broke something. Same input in, exact expected output out. Pass or fail in milliseconds.',
    'When you change a prompt, swap a model version, or tweak a tool description, zero lines of TypeScript or Python logic break. Your unit tests stay green. Yet the feature can silently get worse: extracting the wrong date format, refusing valid requests, or hallucinating fields on messy edge cases.',
    'An evaluation suite (or "eval suite") closes that gap. Instead of testing one input for one exact output, an eval suite runs your feature across a curated collection of realistic test cases — called a golden dataset — grades each answer with a programmatic scorer, and aggregates the results into a pass rate. If that pass rate drops below your threshold on a pull request, CI blocks the merge.',
    'Because live model calls take seconds and cost fractions of a cent, you do not run five hundred slow judge calls on every keystroke. You run a fast, deterministic or small-golden gate on every pull request, and a deeper suite on merge or nightly — giving you both fast feedback and statistical confidence.',
  ],
  intuition: {
    analogy: 'A unit test is a ruler checking one bolt; an eval suite is a wind-tunnel test across thirty flight conditions before you let a wing design ship.',
    paragraphs: [
      'When you machine a bolt (your parser, retry wrapper, or cost ledger), a micrometer gives a binary answer: it meets the 10mm tolerance or it goes in the scrap bin. That is your unit test suite with FakeProvider.',
      'When you reshape an aircraft wing (your prompt or model choice), improving lift in level flight often worsens stall behaviour in a crosswind. Testing one sunny flight tells you nothing. You need a fixed matrix of thirty flight conditions — calm air, turbulence, icing, steep bank — run automatically on every design tweak. You require 100% survival on safety-critical conditions and at least 90% across the whole matrix before the change is allowed onto the tarmac.',
    ],
  },
  technical: [
    'A production eval harness has four concrete parts: (1) a versioned golden dataset of `{ id, input, expected, tags }` cases checked into git alongside the code; (2) the runner that invokes your real prompt-assembly and output-parsing pipeline; (3) composable scorers that grade each output in `[0, 1]`; and (4) a threshold policy that exits non-zero when any required invariant fails.',
    'Keep your golden dataset small, ugly, and stratified. Thirty to fifty real cases beat five hundred synthetic ones. Stratify by intent: roughly 50% representative happy paths, 30% messy boundary cases (typos, missing fields, multi-item inputs), and 20% adversarial or refusal cases harvested directly from past production bugs. Every production incident should graduate into one new golden item.',
    'Prefer deterministic scorers before reaching for an LLM-as-judge. Schema validity, exact field match on enums/IDs, regex/forbidden-phrase checks, citation presence, and numeric tolerance are free, instant, and have zero variance. Reserve model-graded rubrics for genuinely semantic properties (tone, completeness of prose summaries) — and only after calibrating the judge against human labels.',
    'To keep CI fast and flake-free, separate the suite into two tiers. Tier 1 runs on every pull request in under 30 seconds: it checks prompt-assembly snapshots, replays recorded provider cassettes against your parsers and deterministic scorers, and runs a 30-item live smoke set at `temperature: 0` with hard `1.0` thresholds on safety/schema gates and a `>= 0.90` aggregate pass rate. Tier 2 runs post-merge or nightly across the full 100+ item dataset, including model-graded rubrics and latency/cost regression bounds.',
  ],
  deeper: [
    'Non-determinism is a statistical problem, not an excuse to disable CI. Even at `temperature: 0`, floating-point batching in GPU inference can flip borderline tokens. If a 30-item suite has per-item pass probability p = 0.95 on borderline prompts, the binomial standard error is sqrt(p(1-p)/n) ≈ 4.0% — meaning an observed score can wobble by ±1–2 items across runs. You control this in three ways: pin `temperature: 0` and `seed` where supported, score hard invariants (schema, safety refusals) separately at a 100% bar, and allow a narrow margin (or a single automatic retry of failed items only) on soft semantic checks.',
    'Beware Goodhart’s Law on your golden set. If engineers iterate on a prompt twenty times against the exact same 30 items, they will overfit instructions to the quirks of those 30 examples ("if the input mentions Acme Corp, output..."). Prevent this the same way classical ML does: keep a small held-out evaluation split that engineers do not inspect item-by-item during prompt tuning, and refresh the golden set quarterly from sampled production traces.',
  ],
  numbers: {
    title: 'Two-tier CI eval economics — PR gate vs nightly suite',
    rows: [
      ['PR gate golden set', '30 items (20 happy/edge + 10 safety/schema)'],
      ['Avg tokens per item (in + out)', '600 in + 150 out on small/fast tier ($0.40 / $1.60 per 1M)'],
      ['Live cost per PR run', '30 × ($0.00024 + $0.00024) ≈ $0.014 per PR'],
      ['Wall-clock time (concurrency = 10)', '3 waves × ~1.5s = ~4.5 seconds'],
      ['At 25 PR runs / workday', '~$0.35 / day (~$7.50 / month)'],
      ['Nightly full suite (150 items + LLM judge)', '150 items × ~$0.003 ≈ $0.45 / night (~$13.50 / month)'],
      ['Cost of 1 bad prompt regression in prod', 'Hours of on-call triage + broken user trust'],
    ],
    takeaway:
      'A 30-item PR eval gate with bounded concurrency takes ~5 seconds and costs roughly a cent per run — cheaper than the CI runner minute that hosts it, and orders of magnitude cheaper than discovering a prompt regression from user complaints.',
  },
  walkthrough: {
    lang: 'typescript',
    code: `export interface GoldenCase {
  id: string
  input: string
  expectedCategory: 'billing' | 'technical' | 'account'
  mustRefuse: boolean
}

export interface CaseResult {
  id: string
  schemaOk: boolean
  categoryMatch: boolean
  refusalMatch: boolean
  passed: boolean
}

export async function runEvalGate(
  cases: GoldenCase[],
  classify: (input: string) => Promise<{ category?: string; refused: boolean }>,
  minPassRate = 0.9,
): Promise<{ passRate: number; hardGateOk: boolean; failures: CaseResult[] }> {
  const results: CaseResult[] = []
  for (const c of cases) {
    const out = await classify(c.input)
    const schemaOk = typeof out.refused === 'boolean' && (out.refused || typeof out.category === 'string')
    const refusalMatch = out.refused === c.mustRefuse
    const categoryMatch = c.mustRefuse ? out.refused : out.category === c.expectedCategory
    const passed = schemaOk && refusalMatch && categoryMatch
    results.push({ id: c.id, schemaOk, categoryMatch, refusalMatch, passed })
  }
  const hardGateOk = results.every((r) => r.schemaOk && r.refusalMatch)
  const passRate = results.filter((r) => r.passed).length / Math.max(1, results.length)
  const failures = results.filter((r) => !r.passed)
  if (!hardGateOk || passRate < minPassRate) {
    throw new Error(\`Eval gate failed: passRate=\${(passRate * 100).toFixed(1)}%, hardGateOk=\${hardGateOk}\`)
  }
  return { passRate, hardGateOk, failures }
}`,
    notes: [
      ['export interface GoldenCase', 'Each golden item is plain data — checked into git as JSON/JSONL so diffs are reviewable in PRs just like code.'],
      ['classify: (input: string) => Promise<{ category?: string; refused: boolean }>', 'Pass the feature function under test as a dependency. In local smoke tests you can inject a recorded/fake provider; in CI you inject the real provider at temperature 0.'],
      ["const schemaOk = typeof out.refused === 'boolean' && (out.refused || typeof out.category === 'string')", 'Deterministic scorer #1: structural contract. If the output shape is broken, nothing downstream works.'],
      ['const refusalMatch = out.refused === c.mustRefuse', 'Deterministic scorer #2: safety/refusal contract. Both false refusals on benign inputs and missed refusals on adversarial inputs are tracked explicitly.'],
      ['const hardGateOk = results.every((r) => r.schemaOk && r.refusalMatch)', 'Split hard invariants from aggregate accuracy: schema validity and safety refusals require 100% (1.0), while classification accuracy uses minPassRate (0.90).'],
      ['if (!hardGateOk || passRate < minPassRate)', 'Throwing an error with the exact score and failure count causes the CLI/test runner to exit non-zero and fail the GitHub Actions check.'],
    ],
  },
  exercise: {
    prompt:
      'You open a PR that tightens a ticket-triage prompt so it stops hallucinating priority levels. Your CI eval gate fails: overall passRate dropped from 93.3% (28/30) to 83.3% (25/30), even though hallucinated priorities dropped to zero. Write a helper `diffEvalRuns(baseline: CaseResult[], candidate: CaseResult[])` that returns `{ regressions: string[], improvements: string[] }` (by case ID), and list the three engineering actions you take before merging.',
    solution: `export function diffEvalRuns(
  baseline: CaseResult[],
  candidate: CaseResult[],
): { regressions: string[]; improvements: string[] } {
  const baseById = new Map(baseline.map((r) => [r.id, r.passed]))
  const regressions: string[] = []
  const improvements: string[] = []
  for (const curr of candidate) {
    const prev = baseById.get(curr.id)
    if (prev === true && !curr.passed) regressions.push(curr.id)
    if (prev === false && curr.passed) improvements.push(curr.id)
  }
  return { regressions, improvements }
}

// Three engineering actions when a prompt edit trades one metric for another:
// 1. Inspect the exact regressed case IDs (never look only at the aggregate %).
//    Check whether the new prompt became over-cautious and triggered false refusals.
// 2. Fix the prompt (e.g. add 1-2 boundary examples covering the regressed slice)
//    OR split priority extraction from category classification if the instructions conflict.
// 3. Only if a "regressed" golden item had a stale/wrong label, update the golden
//    dataset in the same PR with a comment explaining why the expected label changed.`,
  },
  quiz: [
    {
      q: 'Why can a pull request pass 100% of unit tests against FakeProvider and still break your AI feature in production?',
      options: [
        'Because FakeProvider runs asynchronously while production runs synchronously',
        'Because FakeProvider returns scripted responses — it tests how your code handles a fixed output, not how the live model responds to an edited prompt or schema',
        'Because unit tests cannot assert on JSON objects',
        'Because CI runners do not have enough memory to run unit tests accurately',
      ],
      answer: 1,
      explain:
        'FakeProvider decouples deterministic code tests from live model behaviour. Any change to prompts, model versions, or tool schemas alters the live model’s output distribution, which only an eval suite over a golden set can test.',
    },
    {
      q: 'Your 30-item PR eval suite has two scorers: `schemaValid` (is the JSON valid?) and `answerAccuracy` (does the extracted summary match all key facts?). How should thresholds be configured?',
      options: [
        'Set a single 85% average across both scorers combined',
        'Require 100% (1.0) on `schemaValid` as a hard invariant, and a realistic threshold (e.g. >= 90%) on `answerAccuracy`',
        'Require 100% on both or disable the suite until it reaches 100%',
        'Log the scores in CI but never fail the build',
      ],
      answer: 1,
      explain:
        'Hard structural/safety invariants (`schemaValid`, refusal rules) must hold 100% of the time because a single malformed payload crashes downstream code. Semantic quality (`answerAccuracy`) has natural variance and uses a calibrated pass-rate threshold.',
    },
    {
      q: 'A teammate edits a prompt to fix a customer bug. The PR eval gate drops from 94% to 84% because three billing edge cases started failing. What is the right team policy?',
      options: [
        'Re-run CI three times hoping temperature variance makes it pass',
        'Lower `minPassRate` from 0.90 to 0.80 so the PR can merge before Friday',
        'Add the customer bug as a new golden case, inspect the three regressed billing cases, and refine the prompt (or split the step) until both the new case and existing slice pass',
        'Delete the three failing billing cases from the golden dataset',
      ],
      answer: 2,
      explain:
        'An eval regression is the gate doing its job: catching a whack-a-mole prompt edit before users do. Add the new bug to the golden set and fix the prompt so it satisfies both slices.',
    },
  ],
  realWorld: [
    'Stripe, Intercom, and GitHub Copilot teams gate every system-prompt and model-version bump on stratified golden sets in CI — separating fast PR smoke gates from nightly multi-hundred-item regression runs.',
    'When model providers deprecate a snapshot (e.g. migrating between model point releases), teams with a CI eval gate run one branch with the new model ID, diff the per-case scoreboard in five minutes, and know immediately which prompts need adjustment.',
    'High-maturity AI codebases enforce a simple post-mortem rule: no production prompt incident is closed until the offending input is anonymised and committed to `evals/golden.jsonl`.',
  ],
  further: [
    {
      label: 'OpenAI — Evaluation best practices',
      url: 'https://platform.openai.com/docs/guides/evals',
      note: 'Practical guide to eval-driven development: dataset curation, deterministic vs model-graded scorers, and continuous evaluation.',
    },
    {
      label: 'Anthropic — Building Effective Agents (Evaluation & iteration)',
      url: 'https://www.anthropic.com/engineering/building-effective-agents',
      note: 'Why simple, measurable eval harnesses on real failure cases beat complex frameworks every time.',
    },
    {
      label: 'Hamel Husain — Your AI Product Needs Evals',
      url: 'https://hamel.dev/blog/posts/evals/',
      note: 'Field guide to Tier-1 assertion tests vs Tier-2 LLM judges, error analysis, and wiring evals into CI.',
    },
  ],
}
