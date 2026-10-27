/**
 * Cross-roadmap equivalents — one-directional, authored per roadmap.
 * Chatbot-dev declares links to AI Agents and Prompt Engineering modules.
 * When the equivalent side is Confident+, seeding this module avoids a
 * same-day card flood (the ideas are known; the delta gets a natural schedule).
 */
export const EQUIVALENTS: Record<string, string[]> = {
  'cb-grounding-contract': ['pe-rag-prompts'],
  'cb-refusal-design': ['pe-rag-prompts'],
  'cb-citations': ['pe-rag-prompts'],
  'cb-rag-recap': ['p5-ingestion', 'pe-rag-prompts'],
  'cb-chunking-chat': ['p5-ingestion'],
  'cb-hybrid-retrieval-chat': ['p5-hybrid-retrieval'],
  'cb-multi-source-fusion': ['p5-hybrid-retrieval'],
  'cb-context-budget-chat': ['pe-context-budget'],
  'cb-rolling-summarization': ['pe-memory-prompts'],
  'cb-constraint-persistence': ['pe-memory-prompts'],
  'cb-conversation-evals': ['pe-why-evals', 'p5-rag-eval'],
  'cb-red-team-chat': ['pe-red-team'],
  'cb-injection-defense-chat': ['pe-injection', 'p7-security'],
  'cb-pii-logs': ['aip-privacy-pii'],
  'cb-chat-metrics': ['aip-metrics-dashboards'],
  'cb-ab-chatbots': ['aip-experiments'],
  'cb-parallel-actions': ['aip-async-patterns'],
  'cb-persona-voice': ['pe-priming'],
  'cb-error-repair': ['pe-zero-shot'],
}
