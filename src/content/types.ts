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
  demo?: 'agent-loop' | 'vector-sim'
  walkthrough: { lang: string; code: string; notes: [string, string][] }
  exercise: { prompt: string; solution: string }
  quiz: QuizQ[]
  realWorld: string[]
  further: { label: string; url: string; note: string }[]
}

export type RoadmapStatus = 'live' | 'coming-soon'
export type RoadmapLevel = 'Beginner-friendly' | 'Intermediate' | 'Advanced'

/** Catalog card + detail page metadata. A coming-soon roadmap is valid with only this (plus plannedPhases). */
export interface RoadmapMeta {
  slug: string
  title: string
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
