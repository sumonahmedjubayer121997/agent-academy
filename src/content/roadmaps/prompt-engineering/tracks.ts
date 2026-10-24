import { MODULES } from './modules'
import type { LearningModule } from '../../types'

export type TrackId = 'complete' | 'builder' | 'specialist'
export type SequenceMode = 'phase-order' | 'builder-fast-track'

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
    tagline: 'Fundamentals to capstone — every essential module, in order',
    description:
      'Start from how models read prompts, master structured output and context engineering, then finish with evals, security, and your public prompt library. The default path for most learners.',
    topics: [
      'Prompt anatomy, roles, and clarity',
      'Structured output, schemas, and repair loops',
      'Few-shot, reasoning, grounding, long context',
      'Golden sets, judges, regression suites',
      'Injection, defense layers, red-teaming',
      'Domain playbooks and the capstone library',
    ],
  },
  {
    id: 'builder',
    code: 'B',
    title: 'Builder Fast-Track',
    shortTitle: 'Builders',
    tagline: 'You already ship code — go straight to the API-driven patterns',
    description:
      'For working developers who have already used chat UIs and want the engineering meat: API prompting, schemas, tool calling, repair loops, and extraction pipelines first; theory filled in as needed.',
    topics: [
      'API surface, roles, and parameters',
      'JSON mode and schema design',
      'Function and tool calling',
      'Validate-and-repair and extraction pipelines',
    ],
  },
  {
    id: 'specialist',
    code: 'C',
    title: 'Evals & Safety Specialist',
    shortTitle: 'Evals & Safety',
    tagline: 'The measurement and defense depth of the roadmap',
    description:
      'For people whose job is making other people prompts safe and provably good: measurement, judges, regression gates, injection, layered defense, and red-team method.',
    topics: [
      'Golden sets and metric design',
      'LLM-as-judge calibration',
      'Versioning and CI gates',
      'Injection, leakage, and exfiltration',
      'Defense in depth and red-teaming',
    ],
  },
]

const MODULE_TRACK_MAP: Record<string, TrackId> = {
  // Builder fast-track: the API/code-facing modules
  'pe-chat-vs-api': 'builder',
  'pe-why-structured': 'builder',
  'pe-json-mode': 'builder',
  'pe-schemas': 'builder',
  'pe-function-calling': 'builder',
  'pe-validation-repair': 'builder',
  'pe-extraction': 'builder',
  'pe-streaming-parsing': 'builder',

  // Evals & safety specialist depth
  'pe-why-evals': 'specialist',
  'pe-metrics': 'specialist',
  'pe-regression': 'specialist',
  'pe-error-analysis': 'specialist',
  'pe-optimization': 'specialist',
  'pe-ci-prompts': 'specialist',
  'pe-cost-latency': 'specialist',
  'pe-injection': 'specialist',
  'pe-leakage': 'specialist',
  'pe-defense-layers': 'specialist',
  'pe-spotlighting': 'specialist',
  'pe-red-team': 'specialist',
  'pe-guardrails': 'specialist',
  'pe-responsible': 'specialist',
}

const MODULE_WAVE_MAP: Record<string, 1 | 2 | 3 | 4> = {
  // Wave 1: fundamentals + first structured output
  // (phase 1 defaults below)
}

export function trackForModule(moduleId: string): TrackId {
  return MODULE_TRACK_MAP[moduleId] ?? 'complete'
}

export function trackSpecFor(trackId: TrackId): TrackSpec {
  return TRACKS.find((t) => t.id === trackId) ?? TRACKS[0]
}

export function waveForModule(moduleId: string): 1 | 2 | 3 | 4 {
  const phase = MODULES.find((m) => m.id === moduleId)?.phase ?? 2
  if (phase <= 2) return 1
  if (phase === 3) return 2
  if (phase <= 5) return 3
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
