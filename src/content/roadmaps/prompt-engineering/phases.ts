import type { Phase } from '../../types'

export const PHASES: Phase[] = [
  {
    n: 1,
    id: 'pe-p1',
    title: 'Prompting Fundamentals',
    tagline: 'Make the model do exactly what you meant',
    description:
      'How LLMs actually read a prompt — tokens, roles, and the anatomy of instruction, context, input, and output format. You leave this phase writing zero-shot prompts that behave predictably across models.',
    outcome: 'A personal prompt checklist that takes any vague task and turns it into a specific, structured, testable prompt.',
  },
  {
    n: 2,
    id: 'pe-p2',
    title: 'Structured Output & Schemas',
    tagline: 'Prompts are APIs — treat them like it',
    description:
      'The workhorse skill of applied prompting: getting JSON you can trust, designing schemas the model can satisfy, validating and repairing output, and building extraction pipelines programs depend on.',
    outcome: 'A schema-validated extraction endpoint with a repair loop and a measured success rate — not a hope.',
  },
  {
    n: 3,
    id: 'pe-p3',
    title: 'Context Engineering',
    tagline: 'Spend the context window like money',
    description:
      'Few-shot selection, reasoning patterns, personas, long-context strategy, grounding prompts for RAG, and conversation memory. What deserves tokens, in what order, and why.',
    outcome: 'A grounded, cited, refusal-capable answering prompt with deliberately chosen examples and a documented context budget.',
  },
  {
    n: 4,
    id: 'pe-p4',
    title: 'Eval-Driven Prompting',
    tagline: 'If you did not measure it, you did not improve it',
    description:
      'Golden sets, metrics, LLM-as-judge, regression suites, versioned prompts, and error analysis. The phase that separates prompt engineers from prompt users — every change to a prompt becomes an experiment.',
    outcome: 'An eval harness with a golden set, automated scoring, and a regression gate that catches your own bad edits before users do.',
  },
  {
    n: 5,
    id: 'pe-p5',
    title: 'Prompt Security',
    tagline: 'Your prompt is an attack surface',
    description:
      'Direct and indirect prompt injection, system-prompt leakage, data exfiltration, defense layers, spotlighting, and red-teaming. You learn to attack your own prompts so nobody else gets to first.',
    outcome: 'A red-team report on your own assistant: the attacks that worked, the layers that stopped them, and the ones that did not.',
  },
  {
    n: 6,
    id: 'pe-p6',
    title: 'Domain Playbooks & Capstone',
    tagline: 'Reusable patterns, then your own library',
    description:
      'Battle-tested prompt patterns for search, summarisation, code, agents, content, and text-to-SQL — then the capstone: your own eval-backed prompt library, versioned and documented like real software.',
    outcome: 'A public prompt library with evals per pattern, a README engineers respect, and the interview story to defend it.',
  },
]
