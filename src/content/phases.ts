import type { Phase } from './types'

export const PHASES: Phase[] = [
  {
    n: 1,
    id: 'p1',
    title: 'Python & Developer Foundations',
    tagline: 'Make Python feel the way JavaScript does',
    description:
      'Strengthen Python from basics to confident engineering: idiomatic OOP, packaging, async HTTP, testing, Git workflow, and the data stack you will use in every later phase.',
    outcome: 'Ship a tested, packaged Python app that consumes an API and produces useful insight.',
  },
  {
    n: 2,
    id: 'p2',
    title: 'Mathematics & Machine Learning',
    tagline: 'From intuition to defensible methodology',
    description:
      'Refresh linear algebra, probability, and the calculus actually used in ML, then rebuild classical ML with rigour: proper splits, cross-validation, metric selection, and overfitting control.',
    outcome: 'Train and evaluate models whose methodology you can defend in an interview.',
  },
  {
    n: 3,
    id: 'p3',
    title: 'Deep Learning & Transformers',
    tagline: 'Neural networks, PyTorch, attention',
    description:
      'Build neural networks from first principles, become fluent in PyTorch, learn embeddings as geometry, and open up the transformer — the machine inside every LLM.',
    outcome: 'Build small networks, fine-tune pretrained ones, and read transformer code without fear.',
  },
  {
    n: 4,
    id: 'p4',
    title: 'LLM Application Engineering',
    tagline: 'From model to product',
    description:
      'Work with LLM APIs and local open-weight models: prompt design, context management, schema-validated structured outputs, function calling, streaming, retries, and cost/latency engineering.',
    outcome: 'Build a tool-using assistant that returns validated structured outputs reliably.',
  },
  {
    n: 5,
    id: 'p5',
    title: 'RAG & Knowledge Systems',
    tagline: 'Ground answers in your data',
    description:
      'Ingest documents, chunk them well, embed them, retrieve with hybrid search and reranking, and evaluate retrieval quality instead of guessing.',
    outcome: 'Ship a document question-answering app with source citations and measured quality.',
  },
  {
    n: 6,
    id: 'p6',
    title: 'AI Agents & Agentic Workflows',
    tagline: 'The heart of the role',
    description:
      'The agent loop, tool design, planning, memory, reflection, human approval, deterministic workflows vs agentic decisions — orchestrated with LangGraph and connected to the world via MCP.',
    outcome: 'Build multi-step agents with memory, tools, and human-in-the-loop controls.',
  },
  {
    n: 7,
    id: 'p7',
    title: 'Production AI Engineering',
    tagline: 'Ship it — safely',
    description:
      'FastAPI backends, auth and persistence, Docker, cloud deployment, observability, agent evaluation suites, and security: prompt injection, tool misuse, data leakage, and cost budgets.',
    outcome: 'Deploy a secure, monitored, evaluated agent service behind a public demo.',
  },
  {
    n: 8,
    id: 'p8',
    title: 'Portfolio & Career',
    tagline: 'Prove it',
    description:
      'Polish 3–5 substantial projects into portfolio pieces: READMEs, demos, measured trade-offs, interview narratives, and a final job-readiness review for AI Agent / LLM / Applied AI engineer roles.',
    outcome: 'Walk into interviews with proof of engineering ability, not API glue.',
  },
]
