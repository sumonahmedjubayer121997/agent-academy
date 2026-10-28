/**
 * Cross-roadmap module equivalence (one-way, from AI Programming -> prior roadmaps).
 *
 * Several AI Programming modules cover the same engineering territory as
 * modules in AI Agents (`p*-*`) and Prompt Engineering (`pe-*`) — e.g. chat
 * completions API calls, token/cost accounting, structured JSON + repair loops,
 * retries/streaming, embeddings, observability traces, CI eval gates, and
 * prompt-injection defenses. A learner who already completed the equivalent
 * module elsewhere is credited when cards are seeded for this roadmap so
 * overlapping knowledge is recognised rather than re-taught from scratch.
 *
 * Keep this list conservative: only link modules where completing one genuinely
 * makes repeating the other redundant.
 */
export const EQUIVALENTS: Record<string, string[]> = {
  // Phase 2 · Working with Model APIs
  'aip-first-call': ['p4-llm-apis'],
  'aip-tokens-cost': ['p4-cost-models', 'pe-cost-latency'],
  'aip-structured-io': ['p4-structured-outputs', 'pe-validation-repair'],
  'aip-reliability': ['p4-reliability'],
  'aip-streaming-ux': ['p4-reliability', 'pe-streaming-parsing'],
  'aip-embeddings-api': ['p5-vector-search'],

  // Phase 4 · Evals & Observability
  'aip-logging-tracing': ['p7-observability'],
  'aip-eval-suites': ['p7-testing-evals', 'pe-ci-prompts'],
  'aip-llm-judge': ['p7-testing-evals', 'pe-metrics'],
  'aip-error-taxonomy': ['pe-error-analysis'],

  // Phase 5 · Shipping AI Features
  'aip-fallbacks': ['p7-reliability-cost'],
  'aip-security-prompt': ['p7-security', 'pe-defense-layers'],
}
