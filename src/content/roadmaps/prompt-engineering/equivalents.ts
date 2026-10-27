/**
 * Cross-roadmap equivalents — one-directional, authored per roadmap.
 * PE declares which AI Agents modules cover the same ground. When the AA side
 * is Confident+, seeding the PE module avoids a same-day card flood (the ideas
 * are known; the delta gets a natural schedule instead).
 */
export const EQUIVALENTS: Record<string, string[]> = {
  'pe-why-structured': ['p4-structured-outputs'],
  'pe-json-mode': ['p4-structured-outputs'],
  'pe-schemas': ['p4-structured-outputs'],
  'pe-function-calling': ['p4-function-calling'],
  'pe-zero-shot': ['p4-prompting'],
  'pe-clarity': ['p4-prompting'],
  'pe-context-budget': ['p4-prompting'],
  'pe-why-evals': ['p5-rag-eval'],
  'pe-metrics': ['p5-rag-eval', 'p7-testing-evals'],
  'pe-regression': ['p7-testing-evals'],
  'pe-injection': ['p7-security'],
  'pe-defense-layers': ['p7-security'],
}
