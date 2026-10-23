export interface GlossaryTerm {
  term: string
  def: string
  moduleId: string
}

// Core vocabulary of the agent-engineering track — grows with the curriculum.
export const GLOSSARY: GlossaryTerm[] = [
  { term: 'Agent', def: 'A program that repeatedly asks a model "what next?" and executes its tool requests until a goal is met or a budget stops it.', moduleId: 'p6-agent-mental-model' },
  { term: 'Agent loop', def: 'Observe → Reason → Act → Evaluate, repeated. Every framework is this loop plus state management.', moduleId: 'p6-agent-loop' },
  { term: 'Tool / function calling', def: 'The model returns a structured request (name + arguments); your runtime validates and executes it. The model never executes anything itself.', moduleId: 'p4-function-calling' },
  { term: 'Observation', def: 'The result of a tool execution, appended to the message history so the next reasoning step can condition on it.', moduleId: 'p6-agent-loop' },
  { term: 'Embedding', def: 'A dense vector representing meaning; similar texts point in similar directions. The foundation of retrieval and memory.', moduleId: 'p3-embeddings-repr' },
  { term: 'Cosine similarity', def: 'Angle between two vectors (1 = same direction, 0 = unrelated). Ignores magnitude, so document length does not distort meaning.', moduleId: 'p3-embeddings-repr' },
  { term: 'RAG', def: 'Retrieval-Augmented Generation: fetch relevant evidence first, then have the model answer grounded in (and citing) it.', moduleId: 'p5-hybrid-retrieval' },
  { term: 'Chunking', def: 'Splitting documents into retrieval-sized pieces; boundaries and metadata decide retrieval granularity.', moduleId: 'p5-chunking' },
  { term: 'Hybrid retrieval', def: 'Combining keyword (BM25) and vector search, then fusing results (e.g. reciprocal rank fusion) — precision plus recall.', moduleId: 'p5-hybrid-retrieval' },
  { term: 'Reranking', def: 'A second-pass model that re-scores the top candidates for actual relevance; the cheapest big quality jump in RAG.', moduleId: 'p5-hybrid-retrieval' },
  { term: 'Context window', def: 'The token budget a model can attend to at once; the scarce resource every agent design must budget.', moduleId: 'p3-tokens-inference' },
  { term: 'Token', def: 'A subword unit (BPE-style) — the unit of model input, cost, and latency.', moduleId: 'p3-tokens-inference' },
  { term: 'Attention', def: 'Soft lookup: queries score keys, softmax turns scores into weights, output mixes values. The transformer\'s core operation.', moduleId: 'p3-attention' },
  { term: 'Structured output', def: 'Forcing model responses to validate against a JSON schema, making LLM output programmable and pipelines reliable.', moduleId: 'p4-structured-outputs' },
  { term: 'Human-in-the-loop (HITL)', def: 'A hard gate where an irreversible action pauses for human approval — prompts advise, gates enforce.', moduleId: 'p6-workflows-hitl' },
  { term: 'MCP', def: 'Model Context Protocol — an open standard for connecting models/agents to tools and data ("USB-C for AI").', moduleId: 'p6-mcp' },
  { term: 'Prompt injection', def: 'Attacker-crafted text that makes the model follow new instructions; the SQL injection of the LLM era. Defences: least privilege, gates, output handling.', moduleId: 'p7-security' },
  { term: 'Overfitting', def: 'Model memorises training data (high train, low test score). Remedies: regularisation, more data, proper validation.', moduleId: 'p2-ml-engineering' },
]
