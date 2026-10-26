export type Difficulty = 'foundation' | 'core' | 'advanced'

export interface Phase {
  n: number
  id: string
  title: string
  tagline: string
  description: string
  outcome: string
}

export interface LearningModule {
  id: string
  phase: number
  title: string
  why: string
  objectives: string[]
  prereqs: string[]
  hours: number
  difficulty: Difficulty
  essential: boolean
  completion: string[]
  deliverable: string
  lessonId?: string
  project?: boolean
}

export interface ProjectSpec {
  id: string
  title: string
  moduleId: string
  proves: string
  problem: string
  users: string
  stack: string[]
  milestones: string[]
  evaluation: string
  metrics: string[]
  readme: string[]
  demo: string
  tradeoffs: string
  interview: string[]
}

export interface ResourceSpec {
  title: string
  url: string
  provider: string
  free: boolean
  why: string
  prereqs: string
  supports: string
  /** Which roadmap this resource belongs to; absent = ai-agents (legacy data). */
  roadmap?: string
}

export interface QuizQ {
  q: string
  options: string[]
  answer: number
  explain: string
}

export interface Lesson {
  id: string
  moduleId: string
  title: string
  minutes: number
  tagline: string
  /** Cold-recall question from prerequisite material, shown before section 1. */
  pre?: QuizQ
  simple: string[]
  intuition: { analogy: string; paragraphs: string[] }
  technical: string[]
  /** Optional university-level layer, collapsed under "Go deeper" after the technical section. */
  deeper?: string[]
  numbers?: { title: string; rows: [string, string][]; takeaway: string }
  demo?: 'agent-loop' | 'vector-sim' | 'context-inspector' | 'structured-stepthrough' | 'retry-timeline' | 'cost-meter'
  walkthrough: { lang: string; code: string; notes: [string, string][] }
  exercise: { prompt: string; solution: string }
  quiz: QuizQ[]
  realWorld: string[]
  further: { label: string; url: string; note: string }[]
}

export type RoadmapStatus = 'live' | 'beta' | 'coming-soon'
export type RoadmapLevel = 'Beginner-friendly' | 'Intermediate' | 'Advanced'

/** Catalog card + detail page metadata. A coming-soon roadmap is valid with only this (plus plannedPhases). */
export interface RoadmapMeta {
  slug: string
  title: string
  /** Compact switcher label, e.g. "Automation" for "AI Automation (n8n, Kafka)". */
  shortTitle?: string
  tagline: string
  description: string
  level: RoadmapLevel
  status: RoadmapStatus
  /** lucide icon name; pages map it to a component */
  icon: string
  /** Coming-soon skeletons only — outline shown on the detail page. Hours/counts are set at authoring time, never here. */
  plannedPhases?: Array<{ title: string; blurb: string }>
}

/** Live-roadmap stats for catalog cards, computed from authored content — never hand-written. */
export interface RoadmapStats {
  phases: number
  modules: number
  lessons: number
  hours: number
}

/** Structural shape of a card in a roadmap review deck. */
export interface DeckCardSpec {
  cardId: string
  moduleId: string
  moduleTitle: string
  phase: number
  kind: 'mcq' | 'flashcard'
  prompt: string
  answer: string
  options?: string[]
  correctOption?: number
  lessonId?: string
}

/** Track spec as the engine consumes it (roadmap-local TrackId unions widen to string). */
export interface TrackSpecCommon {
  id: string
  code: 'A' | 'B' | 'C'
  title: string
  shortTitle: string
  tagline: string
  description: string
  topics: string[]
}

/** Practice project as the engine consumes it. */
export interface PracticeProjectSpec {
  id: string
  phase: number
  title: string
  hours: number
  difficulty: string
  brief: string
  stack: string[]
  modules: string[]
  steps: string[]
  doneWhen: string
}

/**
 * The explicit content contract every roadmap bundle must satisfy.
 * Optional parts (LESSONS) let a roadmap ship before lessons are authored.
 */
export interface RoadmapBundle {
  META: RoadmapMeta
  PHASES: Phase[]
  MODULES: LearningModule[]
  LESSONS?: Lesson[]
  EDGE_WHY: Record<string, string>
  TRACKS: TrackSpecCommon[]
  SEQUENCE_MODES: Array<{ id: string; label: string; sub: string }>
  trackForModule(moduleId: string): string
  trackSpecFor(trackId: string): TrackSpecCommon
  waveForModule(moduleId: string): 1 | 2 | 3 | 4
  downstreamUnlockCount(moduleId: string, allModules?: LearningModule[]): number
  ASSESSMENT: Array<QuizQ & { domain: string }>
  DOMAIN_LABELS: Record<string, string>
  DOMAIN_CREDIT: Record<string, { full: string[]; partial: string[] }>
  CURRICULUM_DECK: DeckCardSpec[]
  cardsForModule(moduleId: string): DeckCardSpec[]
  PROJECTS: ProjectSpec[]
  PRACTICE_PROJECTS: PracticeProjectSpec[]
}
