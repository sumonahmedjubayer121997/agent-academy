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
  /** Three-bullet revision summary shown pinned near the top ("If you remember three things"). */
  takeaways?: string[]
  /** Practice-project id this lesson's exercise feeds into (deep link on the projects page). */
  relatedPractice?: string
  /** Cold-recall question from prerequisite material, shown before section 1. */
  pre?: QuizQ
  simple: string[]
  intuition: { analogy: string; paragraphs: string[] }
  technical: string[]
  /** Optional university-level layer, collapsed under "Go deeper" after the technical section. */
  deeper?: string[]
  numbers?: { title: string; rows: [string, string][]; takeaway: string }
  demo?: 'agent-loop' | 'vector-sim' | 'context-inspector' | 'structured-stepthrough' | 'retry-timeline' | 'cost-meter' | 'fallback-ladder' | 'anatomy-builder' | 'fake-provider' | 'chat-turn-stepper' | 'grounding-check'
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

/** Task kind tiers: quick exercise / guided implementation / mini-project. */
export type PracticeTaskKind = 'exercise' | 'guided' | 'project'

/**
 * A chapter-level practical task shown on a module's Practice & Build section.
 * Tasks are the smallest practice unit (smaller than a PracticeProject);
 * `practiceId` reuses an existing project instead of duplicating it, and
 * `offline: true` marks tasks runnable against the fake provider or fixtures.
 */
export interface PracticeTaskSpec {
  id: string
  moduleId: string
  phase: number
  title: string
  kind: PracticeTaskKind
  /** exercise 10–20 · guided 30–60 · project 60–180 */
  minutes: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  /** Real-world framing: why an engineer runs this drill. */
  scenario: string
  /** The problem statement in one or two sentences. */
  task: string
  requirements: string[]
  /** Measurable definition of done. */
  doneWhen: string
  /** Verification checklist — assertions, greps, or observable outcomes. */
  checks: string[]
  /** Progressive reveal: hint 1 nudges, the last is near-solution. */
  hints: string[]
  solution?: string
  pitfalls?: string
  extension?: string
  lessonId?: string
  practiceId?: string
  offline: boolean
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
  /** Optional chapter-level tasks; roadmaps opt in (AI Programming first). */
  PRACTICE_TASKS?: PracticeTaskSpec[]
}
