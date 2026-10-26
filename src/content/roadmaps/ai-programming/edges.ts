// Elaborative-interrogation layer: why each important prerequisite edge exists.
// Keyed "from->to" using module ids; shown on module pages.
export const EDGE_WHY: Record<string, string> = {
  'aip-toolchain->aip-env-config':
    'Secrets management is a tooling decision before it is a security decision — you cannot isolate dev/prod configs until the project shape itself is reproducible.',
  'aip-http-clients->aip-reliability':
    'Retries and breakers are policies ON TOP of a well-behaved client; layering them onto a client without explicit timeouts just multiplies bad requests.',
  'aip-async-patterns->aip-reliability':
    'Backoff without a concurrency cap is a self-DDoS; the bounded-parallel runner is what makes retry storms impossible.',
  'aip-data-models->aip-structured-io':
    'Schema validation at the model boundary is the same discipline as boundary types — you already have the vocabulary; now it guards model output.',
  'aip-testing-fundamentals->aip-first-call':
    'The provider interface exists so the first real call can be tested with a fake — the fake comes before the integration, not after.',
  'aip-first-call->aip-tokens-cost':
    'The usage fields you parsed on day one are the raw material of the cost ledger; attribution is bookkeeping on top of a call you fully control.',
  'aip-structured-io->aip-codegen-fundamentals':
    'A compiler is just a very strict validator — the validate-and-repair habit transfers directly to generate-compile-fix loops.',
  'aip-codegen-fundamentals->aip-spec-as-tests':
    'Compiling is the floor; tests are the ceiling. The loop upgrades from "it parses" to "it satisfies the specification" once you write the tests first.',
  'aip-codegen-fundamentals->aip-sandboxing':
    'The moment generated code runs, it is untrusted code execution — the sandbox is the license that makes running it responsible.',
  'aip-logging-tracing->aip-metrics-dashboards':
    'Metrics are aggregates over structured events; without request-threaded traces your dashboard shows numbers you cannot drill into.',
  'aip-metrics-dashboards->aip-eval-suites':
    'Dashboards show that quality moved; the golden set in CI is what pinpoints which change moved it and blocks the bad merge.',
  'aip-eval-suites->aip-llm-judge':
    'A judge is a golden set that never freezes — but you only learn to distrust it appropriately after running a suite you fully control.',
  'aip-tokens-cost->aip-billing-quota':
    'Quotas are the enforcement arm of the ledger — you cannot cap what you do not attribute.',
  'aip-reliability->aip-fallbacks':
    'The fallback ladder is what the circuit breaker hands off to: once the breaker opens, degradation design decides what the user experiences.',
  'aip-sandboxing->aip-security-prompt':
    'Sandbox thinking — host-enforced limits, not prompt-level promises — is the template for every injection defense in product code.',
}
