import { MODULES } from './modules'
import type { LearningModule } from '../../types'

export type TrackId = 'ai-agents' | 'ml-ds' | 'core-eng'
export type SequenceMode = 'agent-fast-track' | 'phase-order' | 'ml-first'

export interface TrackSpec {
  id: TrackId
  code: 'A' | 'B' | 'C'
  title: string
  shortTitle: string
  tagline: string
  description: string
  topics: string[]
}

/** Sequence modes offered by this roadmap — labels are authored data, not engine copy. */
export const SEQUENCE_MODES: Array<{ id: string; label: string; sub: string }> = [
  { id: 'agent-fast-track', label: 'AI Agent Fast-Track', sub: 'Core Eng → LLMs/RAG → Agents → ML' },
  { id: 'phase-order', label: 'Phase 1 → 8 Order', sub: 'Strict phase-by-phase sequence' },
  { id: 'ml-first', label: 'ML & Data Science First', sub: 'Prioritise Track B math & ML' },
]

export const TRACKS: TrackSpec[] = [
  {
    id: 'ai-agents',
    code: 'A',
    title: 'AI Engineering & AI Agents',
    shortTitle: 'AI & Agents',
    tagline: 'LLMs, RAG, tool calling, LangGraph, MCP, evaluation & safe deployment',
    description:
      'From first LLM API calls and schema-validated outputs to hybrid RAG pipelines, bare-metal and LangGraph agent loops, MCP servers, evaluation harnesses, and prompt-injection defence.',
    topics: [
      'Large language models & prompt engineering',
      'Context engineering & structured outputs',
      'Embeddings, vector databases & semantic search',
      'Retrieval-Augmented Generation (RAG)',
      'Tool calling & agentic workflows',
      'LangChain, LangGraph & MCP',
      'Agent memory, planning, orchestration & evaluation',
      'Multi-agent systems & human-in-the-loop workflows',
      'AI application testing, security & monitoring',
    ],
  },
  {
    id: 'ml-ds',
    code: 'B',
    title: 'Machine Learning & Data Science',
    shortTitle: 'ML & Data Science',
    tagline: 'NumPy, pandas, math intuition, rigorous scikit-learn methodology & PyTorch',
    description:
      'Mathematical foundations (linear algebra, probability, gradients), exploratory data analysis, leakage-free feature engineering, cross-validation, error analysis, neural networks, and transformers.',
    topics: [
      'Python, NumPy, pandas & data visualisation',
      'Exploratory data analysis & statistical reasoning',
      'Probability, statistics & linear algebra',
      'Feature engineering & feature selection',
      'Regression, classification & clustering',
      'Model evaluation, cross-validation & error analysis',
      'Scikit-learn, PyTorch & transformer internals',
      'Experiment tracking & reproducibility',
    ],
  },
  {
    id: 'core-eng',
    code: 'C',
    title: 'Supporting Engineering Skills',
    shortTitle: 'Core Engineering',
    tagline: 'Idiomatic Python, OOP, async HTTP, SQL, FastAPI, testing, Docker & cloud',
    description:
      'The software engineering backbone that turns notebooks and prototypes into reliable, tested, containerised production services.',
    topics: [
      'Python programming, OOP & type safety',
      'Environments, packaging & clean code',
      'Git, GitHub, pytest & debugging',
      'HTTP, JSON, REST APIs & async Python',
      'SQL, SQLite & Postgres databases',
      'FastAPI backends & authentication',
      'Docker, cloud deployment & CI/CD',
    ],
  },
]

const MODULE_TRACK_MAP: Record<string, TrackId> = {
  // Phase 1
  'p1-python-core': 'core-eng',
  'p1-env-packages': 'core-eng',
  'p1-data-stack': 'ml-ds',
  'p1-apis-async': 'core-eng',
  'p1-git-testing': 'core-eng',
  'p1-sql': 'core-eng',
  'p1-project': 'core-eng',

  // Phase 2
  'p2-linear-algebra': 'ml-ds',
  'p2-prob-stats': 'ml-ds',
  'p2-calc-gradient': 'ml-ds',
  'p2-ml-core': 'ml-ds',
  'p2-ml-engineering': 'ml-ds',
  'p2-experiment-tracking': 'ml-ds',
  'p2-project': 'ml-ds',

  // Phase 3
  'p3-nn-fundamentals': 'ml-ds',
  'p3-pytorch': 'ml-ds',
  'p3-embeddings-repr': 'ai-agents',
  'p3-attention': 'ml-ds',
  'p3-tokens-inference': 'ai-agents',
  'p3-finetuning': 'ai-agents',
  'p3-project': 'ml-ds',

  // Phase 4
  'p4-llm-apis': 'ai-agents',
  'p4-prompting': 'ai-agents',
  'p4-structured-outputs': 'ai-agents',
  'p4-function-calling': 'ai-agents',
  'p4-reliability': 'ai-agents',
  'p4-cost-models': 'ai-agents',
  'p4-project': 'ai-agents',

  // Phase 5
  'p5-ingestion': 'ai-agents',
  'p5-chunking': 'ai-agents',
  'p5-vector-search': 'ai-agents',
  'p5-hybrid-retrieval': 'ai-agents',
  'p5-grounding': 'ai-agents',
  'p5-rag-eval': 'ai-agents',
  'p5-project': 'ai-agents',

  // Phase 6
  'p6-agent-mental-model': 'ai-agents',
  'p6-agent-loop': 'ai-agents',
  'p6-tools-design': 'ai-agents',
  'p6-planning': 'ai-agents',
  'p6-memory': 'ai-agents',
  'p6-reflection': 'ai-agents',
  'p6-workflows-hitl': 'ai-agents',
  'p6-langchain-langgraph': 'ai-agents',
  'p6-mcp': 'ai-agents',
  'p6-multi-agent': 'ai-agents',
  'p6-projects': 'ai-agents',

  // Phase 7
  'p7-fastapi': 'core-eng',
  'p7-auth-persistence': 'core-eng',
  'p7-docker': 'core-eng',
  'p7-cloud': 'core-eng',
  'p7-observability': 'ai-agents',
  'p7-testing-evals': 'ai-agents',
  'p7-security': 'ai-agents',
  'p7-reliability-cost': 'ai-agents',
  'p7-cicd': 'core-eng',
  'p7-project': 'ai-agents',

  // Phase 8
  'p8-portfolio': 'ai-agents',
  'p8-readmes-demos': 'ai-agents',
  'p8-interview-prep': 'ai-agents',
  'p8-final-review': 'ai-agents',
}

/**
 * Wave ordering for the "AI Agent Fast-Track" sequence mode:
 * Wave 1: Python, Async, Git/Testing, SQL, Linear Algebra foundations + Project #1
 * Wave 2: Embeddings, Tokens, Phase 4 LLM Apps, Phase 5 RAG + Projects #3 & #4
 * Wave 3: Phase 6 Agents, Phase 7 Production AI, Phase 8 Portfolio + Capstone #5
 * Wave 4: Deep Classical ML, Statistics, Calculus, Neural Nets & PyTorch + Project #2
 */
const MODULE_WAVE_MAP: Record<string, 1 | 2 | 3 | 4> = {
  'p1-python-core': 1,
  'p1-env-packages': 1,
  'p1-apis-async': 1,
  'p1-git-testing': 1,
  'p1-sql': 1,
  'p1-data-stack': 1,
  'p1-project': 1,
  'p2-linear-algebra': 1,

  'p3-embeddings-repr': 2,
  'p3-tokens-inference': 2,
  'p4-llm-apis': 2,
  'p4-prompting': 2,
  'p4-structured-outputs': 2,
  'p4-function-calling': 2,
  'p4-reliability': 2,
  'p4-cost-models': 2,
  'p4-project': 2,
  'p5-ingestion': 2,
  'p5-chunking': 2,
  'p5-vector-search': 2,
  'p5-hybrid-retrieval': 2,
  'p5-grounding': 2,
  'p5-rag-eval': 2,
  'p5-project': 2,

  'p6-agent-mental-model': 3,
  'p6-agent-loop': 3,
  'p6-tools-design': 3,
  'p6-planning': 3,
  'p6-memory': 3,
  'p6-reflection': 3,
  'p6-workflows-hitl': 3,
  'p6-langchain-langgraph': 3,
  'p6-mcp': 3,
  'p6-multi-agent': 3,
  'p6-projects': 3,
  'p7-fastapi': 3,
  'p7-auth-persistence': 3,
  'p7-docker': 3,
  'p7-cloud': 3,
  'p7-observability': 3,
  'p7-testing-evals': 3,
  'p7-security': 3,
  'p7-reliability-cost': 3,
  'p7-cicd': 3,
  'p7-project': 3,
  'p8-portfolio': 3,
  'p8-readmes-demos': 3,
  'p8-interview-prep': 3,
  'p8-final-review': 3,

  'p2-prob-stats': 4,
  'p2-calc-gradient': 4,
  'p2-ml-core': 4,
  'p2-ml-engineering': 4,
  'p2-experiment-tracking': 4,
  'p2-project': 4,
  'p3-nn-fundamentals': 4,
  'p3-pytorch': 4,
  'p3-attention': 4,
  'p3-finetuning': 4,
  'p3-project': 4,
}

export function trackForModule(moduleId: string): TrackId {
  return MODULE_TRACK_MAP[moduleId] ?? 'ai-agents'
}

export function trackSpecFor(trackId: TrackId): TrackSpec {
  return TRACKS.find((t) => t.id === trackId) ?? TRACKS[0]
}

export function waveForModule(moduleId: string): 1 | 2 | 3 | 4 {
  return MODULE_WAVE_MAP[moduleId] ?? 2
}

/** Count how many essential downstream modules depend (directly or transitively) on `moduleId`. */
export function downstreamUnlockCount(moduleId: string, allModules: LearningModule[] = MODULES): number {
  const visited = new Set<string>()
  const queue = [moduleId]
  while (queue.length > 0) {
    const cur = queue.shift()!
    for (const m of allModules) {
      if (m.prereqs.includes(cur) && !visited.has(m.id)) {
        visited.add(m.id)
        queue.push(m.id)
      }
    }
  }
  return Array.from(visited).filter((id) => allModules.find((m) => m.id === id)?.essential).length
}
