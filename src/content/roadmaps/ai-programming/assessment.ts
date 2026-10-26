import type { QuizQ } from '../../types'

export type Domain = 'toolchain' | 'model-apis' | 'codegen' | 'evals-ops'

export const DOMAIN_LABELS: Record<Domain, string> = {
  toolchain: 'Toolchain & Foundations',
  'model-apis': 'Model API Integration',
  codegen: 'Code Generation Patterns',
  'evals-ops': 'Evals & Operations',
}

// Conservative crediting: only a perfect domain score credits modules as completed;
// 2/3 marks them "in progress" for revision. Nothing is ever auto-inflated.
export const DOMAIN_CREDIT: Record<Domain, { full: string[]; partial: string[] }> = {
  toolchain: { full: ['aip-env-config'], partial: ['aip-toolchain', 'aip-http-clients'] },
  'model-apis': { full: [], partial: ['aip-first-call', 'aip-reliability'] },
  codegen: { full: [], partial: ['aip-codegen-fundamentals'] },
  'evals-ops': { full: [], partial: ['aip-logging-tracing'] },
}

export const ASSESSMENT: (QuizQ & { domain: Domain })[] = [
  // ── Toolchain & Foundations ──
  {
    domain: 'toolchain',
    q: 'Where do provider API keys belong in an AI application?',
    options: [
      'Committed to the repo in a config file for reproducibility',
      'Environment variables or a secrets manager, read into typed settings',
      'Hardcoded behind a feature flag in production builds',
      'In the frontend bundle, obfuscated',
    ],
    answer: 1,
    explain:
      'Keys live in env vars or a secrets manager and are loaded into typed, validated settings at startup. Anything shipped to the client (obfuscated or not) is public; anything committed is one clone away from leakage.',
  },
  {
    domain: 'toolchain',
    q: 'A model API returns 401 for one user and 429 for another a second later. Correct handling?',
    options: [
      'Retry both — they are both errors',
      'Never retry the 401 (auth/config problem); retry the 429 with backoff (rate limit)',
      'Retry the 401, fail fast on the 429',
      'Escalate both to the circuit breaker immediately',
    ],
    answer: 1,
    explain:
      '4xx-class client errors (401, 400) will fail identically on retry — fix the cause. 429 and 5xx are transient: retry with exponential backoff and jitter, respecting provider guidance.',
  },
  {
    domain: 'toolchain',
    q: 'Why does the non-AI layer deserve ordinary unit tests in an AI feature?',
    options: [
      'It is the only part executives understand',
      'Most of the feature is ordinary code, and testing it deterministically keeps the model layer debuggable',
      'Unit tests can verify model accuracy if written well',
      'It is not — only eval suites matter',
    ],
    answer: 1,
    explain:
      'Roughly 80% of an AI feature is plumbing: validation, routing, retries, caching. Testing that deterministically (with a fake provider) isolates the nondeterministic 20% and makes it measurable.',
  },
  // ── Model API Integration ──
  {
    domain: 'model-apis',
    q: 'Your dashboard shows average latency is fine but users complain the feature is slow. Most likely blind spot?',
    options: [
      'Users are wrong; averages do not lie',
      'You are averaging total completion time and ignoring time-to-first-token — streaming UX changes perceived latency',
      'The model provider is throttling specific users',
      'Latency should be measured on the server, not the client',
    ],
    answer: 1,
    explain:
      'A streamed answer that starts in 300ms feels fast even if it completes in 4s. TTFT and total time are different metrics with different fixes — and neither average tells the p95 story.',
  },
  {
    domain: 'model-apis',
    q: 'What does a circuit breaker add that retries alone do not?',
    options: [
      'It retries faster',
      'It stops hammering an already-failing dependency, failing fast until a probe succeeds — protecting both sides',
      'It caches failed responses for reuse',
      'It upgrades the request to a larger model',
    ],
    answer: 1,
    explain:
      'Retries treat each call independently; under sustained failure they multiply load exactly when the provider is drowning. The breaker opens after consecutive failures, fails fast, and half-open probes for recovery.',
  },
  {
    domain: 'model-apis',
    q: 'Cost attribution for an AI feature should be keyed on…',
    options: [
      'Total monthly invoice only',
      'Per call: model, tokens in/out, price — attributed to feature and user, persisted in a ledger',
      'The number of API errors per day',
      'Frontend session duration',
    ],
    answer: 1,
    explain:
      'The invoice tells you what you paid, not what cost it or who caused it. Per-call ledger entries (model × tokens × price, tagged feature+user) enable budgets, quotas, and per-feature unit economics.',
  },
  // ── Code Generation Patterns ──
  {
    domain: 'codegen',
    q: 'Why are failing tests a better specification for generated code than a written description?',
    options: [
      'Tests run faster than descriptions parse',
      'Tests are unambiguous and machine-checkable — the generation loop has a real oracle instead of "looks right"',
      'Descriptions cannot be given to models',
      'Tests guarantee the code is efficient',
    ],
    answer: 1,
    explain:
      'Natural-language specs leave room for plausible-but-wrong implementations. Tests define acceptance precisely and give your bounded generate-run-fix loop an oracle — while remaining fallible to spec gaps you must actively probe.',
  },
  {
    domain: 'codegen',
    q: 'Before executing model-generated code you must…',
    options: [
      'Read it carefully and trust your review',
      'Run it in a sandbox with time, memory, filesystem, and network limits enforced by the host, not the prompt',
      'Ask the model to certify it is safe',
      'Only execute code shorter than 50 lines',
    ],
    answer: 1,
    explain:
      'Review is necessary but not sufficient — LLM-written code is untrusted input like any other. Host-enforced sandboxing (containers/seatbelts) is the control that actually stops the infinite loop, the file write, and the network call.',
  },
  {
    domain: 'codegen',
    q: 'Whole-file rewrites vs diff/patch edits for modifying code: the key engineering argument for diffs is…',
    options: [
      'Diffs are always shorter, so cheaper',
      'Diffs make changes reviewable and surgical, preserving untouched code and history',
      'Models cannot generate whole files correctly',
      'Patches apply without any validation',
    ],
    answer: 1,
    explain:
      'Surgical diffs keep the blast radius small and the review human-scale. They do require a patch engine with strict validation and a fallback when context has drifted — cheapness is a side benefit, not the argument.',
  },
  // ── Evals & Operations ──
  {
    domain: 'evals-ops',
    q: 'An eval suite in CI primarily protects against…',
    options: [
      'Security vulnerabilities',
      'Behavioral regressions from prompt edits, model swaps, or library upgrades — before users see them',
      'High cloud bills',
      'Slow database queries',
    ],
    answer: 1,
    explain:
      'AI features change behavior without changing code. A frozen golden set, scored in CI with a threshold, is the contract that makes "upgrade the model" a tested change instead of a prayer.',
  },
  {
    domain: 'evals-ops',
    q: 'Before trusting an LLM-as-judge for monitoring, you must…',
    options: [
      'Use the largest model available as judge',
      'Calibrate it against your own labeled samples and measure the agreement rate',
      'Set judge temperature to 2 for diverse opinions',
      'Run it once on a single example',
    ],
    answer: 1,
    explain:
      'A judge is a measurement instrument; instruments get calibrated. Agreement with your labels on a sample tells you where its scores are trustworthy — and where only human review will do.',
  },
  {
    domain: 'evals-ops',
    q: 'Feature flags for AI features exist mainly to…',
    options: [
      'A/B test marketing copy',
      'Decouple deploy from release — gradual rollout, instant kill switch, and targeted exposure for a behavior that can drift',
      'Reduce hosting costs',
      'Satisfy CI pipelines',
    ],
    answer: 1,
    explain:
      'AI behavior can regress without a code change, so you need an off switch that works in seconds and a ramp (1% -> 10% -> 100%) with stop conditions — independent of deployment.',
  },
]
