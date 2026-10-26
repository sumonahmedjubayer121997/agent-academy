import type { Phase } from '../../types'

export const PHASES: Phase[] = [
  {
    n: 1,
    id: 'aip-p1',
    title: 'Engineering Foundations for AI Work',
    tagline: 'The non-AI layer that carries every AI feature',
    description:
      'Modern tooling, typed data models, safe HTTP and async patterns, and tests for everything the model does not touch. AI features fail in this layer first.',
    outcome: 'A typed, tested, CI-backed CLI tool that consumes a public API — the skeleton every later phase hangs from.',
  },
  {
    n: 2,
    id: 'aip-p2',
    title: 'Working with Model APIs',
    tagline: 'Treat the model like any other dependency — a flaky, expensive one',
    description:
      'Chat shapes, streaming, structured input/output, tokens and cost control, retries and circuit breakers, caching, embeddings APIs, and multimodal inputs — the integration layer of every AI product.',
    outcome: 'A hardened model-client library with retries, caching, and cost accounting that later phases reuse.',
  },
  {
    n: 3,
    id: 'aip-p3',
    title: 'Code Generation Patterns',
    tagline: 'Generated code you can compile, run, and trust',
    description:
      'Prompting for compilable output, tests as the specification, diff and patch editing, sandboxed execution, refactoring at scale, review bots, and scaffolding tools.',
    outcome: 'A tests-first code generator that executes its own output in a sandbox and refuses to ship failing code.',
  },
  {
    n: 4,
    id: 'aip-p4',
    title: 'Evals & Observability',
    tagline: 'If the dashboard cannot see it, the user already has',
    description:
      'Tracing model calls, the metrics that matter, eval suites in CI, LLM-as-judge for monitoring, regression alerts, failure taxonomies, user feedback signals, and A/B testing AI behavior.',
    outcome: 'An observability stack on one real feature: traces, dashboards, a CI-gated eval suite, and a quality alert.',
  },
  {
    n: 5,
    id: 'aip-p5',
    title: 'Shipping AI Features',
    tagline: 'From demo to deployable',
    description:
      'Feature flags and gradual rollout, fallbacks and graceful degradation, latency engineering, injection defenses in product code, privacy and PII, quotas and budgets, deployment topologies, and the capstone.',
    outcome: 'One AI feature shipped end-to-end: flag-gated, fallback-ready, latency- and cost-budgeted, observable, and defensible in an interview.',
  },
]
