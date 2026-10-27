import { MODULES } from './modules'
import type { LearningModule } from '../../types'

export type TrackId = 'complete' | 'rag-first' | 'ops-safety'
export type SequenceMode = 'phase-order' | 'rag-first'

export interface TrackSpec {
  id: TrackId
  code: 'A' | 'B' | 'C'
  title: string
  shortTitle: string
  tagline: string
  description: string
  topics: string[]
}

export const TRACKS: TrackSpec[] = [
  {
    id: 'complete',
    code: 'A',
    title: 'The Complete Path',
    shortTitle: 'Complete',
    tagline: 'Design to shipped bot — every essential module, in order',
    description:
      'Start with conversation design, build grounded answers, engineer memory, add gated tools, ship two channels, and finish with evals, red-teaming, and the capstone. The default path.',
    topics: [
      'Conversation patterns, repair, scoping',
      'Grounded RAG with citations and refusals',
      'State, memory, compaction',
      'Slot filling, gates, handoff',
      'Web + Telegram channels',
      'Golden chats, red-team, metrics',
    ],
  },
  {
    id: 'rag-first',
    code: 'B',
    title: 'RAG-First',
    shortTitle: 'RAG-First',
    tagline: 'Ship a grounded FAQ bot this week — design depth as you grow',
    description:
      'For builders who need a working grounded chatbot fast: retrieval, grounding contract, citations, refusals, and a web widget first; conversation design depth and memory as the bot matures.',
    topics: [
      'RAG chat and grounding contract',
      'Citations and refusal design',
      'Web widget with TTFT budget',
      'Conversation evals',
    ],
  },
  {
    id: 'ops-safety',
    code: 'C',
    title: 'Ops & Safety Specialist',
    shortTitle: 'Ops & Safety',
    tagline: 'The evaluation and defense depth of the roadmap',
    description:
      'For people who own chatbots other people build: golden-conversation evals, red-teaming across vectors, layered injection defense, PII and logs, metrics, and A/B testing.',
    topics: [
      'Multi-turn golden evals',
      'Red-team method',
      'Injection defense layers',
      'PII, retention, isolation',
      'Metrics and experiments',
    ],
  },
]

/** Sequence modes offered by this roadmap — labels are authored data, not engine copy. */
export const SEQUENCE_MODES: Array<{ id: string; label: string; sub: string }> = [
  { id: 'phase-order', label: 'Phase 1 → 6 Order', sub: 'Strict phase-by-phase sequence' },
  { id: 'rag-first', label: 'RAG-First', sub: 'Grounded FAQ bot first, design depth later' },
]

const MODULE_TRACK_MAP: Record<string, TrackId> = {
  'cb-rag-recap': 'rag-first',
  'cb-grounding-contract': 'rag-first',
  'cb-citations': 'rag-first',
  'cb-refusal-design': 'rag-first',
  'cb-chunking-chat': 'rag-first',
  'cb-hybrid-retrieval-chat': 'rag-first',
  'cb-multi-source-fusion': 'rag-first',
  'cb-channel-web': 'rag-first',
  'cb-conversation-evals': 'ops-safety',
  'cb-red-team-chat': 'ops-safety',
  'cb-injection-defense-chat': 'ops-safety',
  'cb-pii-logs': 'ops-safety',
  'cb-chat-metrics': 'ops-safety',
  'cb-ab-chatbots': 'ops-safety',
  'cb-capstone-chatbot': 'ops-safety',
}

export function trackForModule(moduleId: string): TrackId {
  return MODULE_TRACK_MAP[moduleId] ?? 'complete'
}

export function trackSpecFor(trackId: TrackId): TrackSpec {
  return TRACKS.find((t) => t.id === trackId) ?? TRACKS[0]
}

export function waveForModule(moduleId: string): 1 | 2 | 3 | 4 {
  const phase = MODULES.find((m) => m.id === moduleId)?.phase ?? 2
  if (phase <= 1) return 1
  if (phase <= 3) return 2
  if (phase <= 4) return 3
  return 4
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
