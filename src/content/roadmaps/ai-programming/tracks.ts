import { MODULES } from './modules'
import type { LearningModule } from '../../types'

export type TrackId = 'complete' | 'api-first' | 'codegen-specialist'
export type SequenceMode = 'phase-order' | 'api-first'

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
    tagline: 'Foundations to shipped feature — every essential module, in order',
    description:
      'Start from the toolchain, master model-API integration, learn code generation with sandboxes, wire up evals and observability, and finish with a shipped, budgeted feature. The default path.',
    topics: [
      'Toolchain, secrets, HTTP and async patterns',
      'Model APIs: reliability, caching, cost, streaming',
      'Code generation with tests as specs and sandboxes',
      'Evals, dashboards, CI gates, judges',
      'Flags, fallbacks, budgets, deployment',
    ],
  },
  {
    id: 'api-first',
    code: 'B',
    title: 'API-First',
    shortTitle: 'API-First',
    tagline: 'You already ship software — go straight to the model layer',
    description:
      'For working developers who need the AI-specific half: hardened integrations, structured I/O, cost control, streaming, evals, and shipping practices — with foundations as reference material.',
    topics: [
      'Model APIs and structured I/O',
      'Retries, breakers, caching, cost ledgers',
      'Streaming UX and TTFT',
      'Eval suites and dashboards',
      'Flags, fallbacks, quotas',
    ],
  },
  {
    id: 'codegen-specialist',
    code: 'C',
    title: 'Code Generation Specialist',
    shortTitle: 'Codegen',
    tagline: 'The AI-coding depth of the roadmap',
    description:
      'For people whose job is AI-assisted engineering itself: compile-fix loops, tests as specs, patch engines, sandboxing, refactoring at scale, and review automation with measured precision.',
    topics: [
      'Generate-compile-fix loops',
      'Tests as specifications',
      'Diff/patch engines',
      'Sandboxing and threat models',
      'Review bots and precision scorecards',
    ],
  },
]

/** Sequence modes offered by this roadmap — labels are authored data, not engine copy. */
export const SEQUENCE_MODES: Array<{ id: string; label: string; sub: string }> = [
  { id: 'phase-order', label: 'Phase 1 → 5 Order', sub: 'Strict phase-by-phase sequence' },
  { id: 'api-first', label: 'API-First', sub: 'Skip to the model layer if you already ship code' },
]

const MODULE_TRACK_MAP: Record<string, TrackId> = {
  'aip-codegen-fundamentals': 'codegen-specialist',
  'aip-spec-as-tests': 'codegen-specialist',
  'aip-diff-editing': 'codegen-specialist',
  'aip-sandboxing': 'codegen-specialist',
  'aip-refactoring-agents': 'codegen-specialist',
  'aip-code-review-bots': 'codegen-specialist',
  'aip-docs-from-code': 'codegen-specialist',
  'aip-scaffolding': 'codegen-specialist',
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
  if (phase === 2) return 2
  if (phase <= 3) return 3
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
