import type { ProjectSpec } from '../../types'

/** The four portfolio checkpoints of the AI Programming roadmap. */
export const PROJECTS: ProjectSpec[] = [
  {
    id: 'aip-project-gateway',
    title: 'Typed LLM Gateway',
    moduleId: 'aip-capstone-ai-prog',
    proves: 'model-API reliability engineering: retries, caching, cost control behind one interface',
    problem:
      'Every AI feature re-implements the same fragile plumbing — timeouts, retries, caching, cost attribution — slightly differently and slightly wrong. You will build the shared gateway every feature deserves: one typed interface over any provider, hardened, cached, and metered.',
    users:
      'Your own later projects and any team shipping more than one AI feature.',
    stack: ['Python (FastAPI) or TypeScript', 'pydantic or zod', 'Redis or SQLite for cache/ledger', 'pytest/vitest'],
    milestones: [
      'Provider interface + fake + one real provider, swapped by config',
      'Reliability layer: backoff retries, no-retry classes, circuit breaker',
      'Structured I/O with schema validation and bounded repair',
      'Exact-match cache with TTL and written cache policy',
      'Cost ledger with per-feature/user attribution and budget alerts',
      'Streaming pass-through with TTFT instrumentation',
      'Reliability drills: fault-injection suite proving every claim',
    ],
    evaluation:
      'Fault-injection tests for each failure mode; measured cache savings on a replayed workload; cost report reconciling against provider usage; p50/p95 latency and TTFT under load.',
    metrics: [
      'failure modes covered by tests',
      'cache hit rate on replayed workload',
      'cost saved vs uncached baseline',
      'retry/breaker behavior timeline',
      'TTFT and total p95 latency',
    ],
    readme: [
      'The interface contract and how to add a provider',
      'Reliability policy table: error class -> behavior',
      'Cache policy: what may be cached and why',
      'Cost attribution method and budget alerting',
      'Known limits: what the gateway deliberately does not do',
    ],
    demo: 'A live swap: same request through fake and real providers, a forced 429 storm absorbed by retries, and a budget alert firing on the dashboard.',
    tradeoffs:
      'Be ready to defend: why retries are per-error-class, cache key choices (and their PII implications), breaker thresholds, and why the gateway stays provider-agnostic even if you only use one provider today.',
    interview: [
      'Walk me through what happens when the provider returns 429 twice then succeeds — line by line.',
      'A teammate wants to cache every response. What do you tell them about PII?',
      'How would you add a second provider with automatic failover tomorrow?',
      'Your breaker keeps tripping at 3am. What do you check first?',
    ],
  },
  {
    id: 'aip-project-codegen',
    title: 'Test-Spec Code Generator',
    moduleId: 'aip-spec-as-tests',
    proves: 'code-generation engineering: specs as tests, sandboxed execution, honest pass rates',
    problem:
      'Generated code that "looks right" is a liability. You will build the generator that only ships code passing a test suite the human wrote first — executing in a sandbox, feeding failures back, and reporting exactly how reliable it is.',
    users:
      'Developers who want AI-written units without review roulette.',
    stack: ['Python or TypeScript', 'the gateway from project 1', 'Docker or a seatbelt', 'pytest/vitest'],
    milestones: [
      'Spec format: failing tests + signature + constraints as input',
      'Generation loop with compile/run feedback, bounded attempts',
      'Sandboxed execution: time, memory, network, filesystem limits',
      'Pass-rate harness over a 20-unit benchmark set',
      'Error taxonomy on failures: spec gap vs model gap vs harness gap',
      'Attack suite: malicious generations blocked by the sandbox',
      'README with honest numbers and failure gallery',
    ],
    evaluation:
      'First-pass and post-feedback pass rates on the benchmark; sandbox blocking all attack classes; every failure in the gallery classified.',
    metrics: [
      'benchmark size',
      'first-pass pass rate',
      'post-feedback pass rate',
      'sandbox attacks blocked',
      'attempts-to-green distribution',
    ],
    readme: [
      'The spec format and how to write a good one',
      'Why tests are the specification, not comments',
      'Sandbox threat model: what is and is not stopped',
      'Benchmark results with the failure gallery',
      'When to fall back to writing the code yourself',
    ],
    demo: 'A failing-test spec goes in; generated code goes into the sandbox; tests run live; one generation fails and the feedback loop fixes it on camera.',
    tradeoffs:
      'Expect questions on: underspecified specs producing wrong-but-green code (show your example), sandbox limits vs usability, attempt bounds and their cost, and why some units should stay human-written.',
    interview: [
      'Your generator passes tests but the code is wrong. How did you detect and handle that?',
      'What does the sandbox NOT protect against, honestly?',
      'When would you refuse to auto-apply generated code?',
      'How do you keep the benchmark from becoming the training set?',
    ],
  },
  {
    id: 'aip-project-observability',
    title: 'AI Feature Observability Stack',
    moduleId: 'aip-eval-suites',
    proves: 'evals and observability: traces, five-number dashboards, CI gates, calibrated judging',
    problem:
      'AI features ship blind: nobody can say if quality moved this week. You will instrument one real feature end to end — structured traces, the five metrics that matter, a CI-gated eval suite, and a calibrated judge — and catch a planted regression before users do.',
    users:
      'Any team shipping an AI feature that anyone depends on.',
    stack: ['Your gateway', 'structured logs', 'Grafana/Chronon or plots', 'CI', 'pytest/vitest'],
    milestones: [
      'Structured traces with request ids across all boundaries',
      'Five-metric dashboard with thresholds annotated',
      'Golden set (30+ items) scored in CI as a required check',
      'Redaction policy proven on planted secrets/PII',
      'Calibrated LLM-judge on live samples with agreement stats',
      'Alert pack: cost, latency, quality — with runbooks',
      'Planted-regression demo: dashboard + CI both catch it',
    ],
    evaluation:
      'End-to-end trace reconstruction from logs; the planted regression caught by both dashboard and CI; judge agreement rate published; alert false-positive rate over a replayed week.',
    metrics: [
      'golden-set size and pass threshold',
      'TTFT/latency p50-p95 reported',
      'judge agreement rate',
      'time-to-detect planted regression',
      'alert false-positive rate',
    ],
    readme: [
      'The five numbers and why exactly these',
      'Trace schema and redaction rules',
      'How the CI gate decides pass/fail',
      'Judge calibration method and measured trust level',
      'Runbooks for each alert',
    ],
    demo: 'A slow-mo replay: feature running, regression planted, dashboard moves, alert fires, CI goes red — detected before the user complaint would have arrived.',
    tradeoffs:
      'Be ready to defend: why these five metrics and not twenty, sampling strategy for the judge, what the eval suite cannot catch (and the user-signal plan for that), and alert thresholds vs on-call fatigue.',
    interview: [
      'Quality dropped 8% this week. Walk me through your first fifteen minutes.',
      'Your eval suite is green but complaints are up. Where do you look?',
      'How do you prevent the golden set from rotting as real usage evolves?',
      'When is a judge good enough to alert on, versus only to chart?',
    ],
  },
  {
    id: 'aip-project-capstone',
    title: 'Shipped AI Feature (Capstone)',
    moduleId: 'aip-capstone-ai-prog',
    proves: 'the whole roadmap: one real feature, production-shaped, observable, and economically honest',
    problem:
      'The portfolio piece. Pick one real feature with at least one real user (you count), and ship it carrying every practice: the gateway, streaming UX, evals in CI, dashboards, a flag, a fallback ladder, quotas, and a written record of trade-offs and numbers.',
    users:
      'Whoever has the problem you picked — and every recruiter who reads the README.',
    stack: ['Everything from the roadmap', 'a deployment target (Vercel/Fly/a VPS)'],
    milestones: [
      'Feature picked and scoped with a written latency + cost budget',
      'Gateway + structured I/O + streaming from earlier projects integrated',
      'Flag-gated deploy: dark, then 1% -> 100% ramp with stop condition',
      'Fallback ladder drilled and user copy approved',
      'Eval suite green in CI; dashboard and alerts live',
      'Quota + budget ceiling enforced; usage report generated',
      'README: architecture, numbers, trade-off log, demo, limitations',
    ],
    evaluation:
      'It is live and used; budgets (latency, cost) hold over a measured week; the kill switch and fallback ladder each drilled once; the eval gate demonstrably blocks a bad edit.',
    metrics: [
      'weekly active usage (even if that is just you)',
      'p95 latency and TTFT vs budget',
      'weekly cost vs budget',
      'eval pass rate',
      'degradation rung distribution',
    ],
    readme: [
      'What the feature does and for whom (one paragraph)',
      'Architecture diagram and the gateway reuse story',
      'The numbers: latency, cost, quality — against budget',
      'The trade-off log: decisions you made and rejected alternatives',
      'Limitations and what you would build next',
    ],
    demo: 'A two-minute video: real usage, a live dashboard, a flag flip, a forced degradation — narrated like an engineer, not a marketer.',
    tradeoffs:
      'Be ready to defend: scope choice, budget trade-offs you made (and where you refused to cut), why the feature is flag-gated still, and what the numbers say about whether this was worth building.',
    interview: [
      'Show me the week the numbers went bad. What did you do?',
      'What did you cut to hit the latency budget — and what did you refuse to cut?',
      'If usage 100x-d tomorrow, what breaks first and what is your plan?',
      'What would you do differently if you rebuilt it today?',
    ],
  },
]
